import os
import json
import torch
import string
import math
import cv2
import numpy as np
import easyocr
import google.generativeai as genai
import uvicorn
import time  

from fastapi import FastAPI, UploadFile, File, HTTPException, Request 
from fastapi.responses import RedirectResponse 
from PIL import Image
import torchvision.transforms as transforms

# Import modul custom kamu
from utils import CTCLabelConverter
from model import Model

app = FastAPI()

# ==========================================
# 0. MIDDLEWARE LATENCY TRACKING (API HTTP)
# ==========================================
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f} sec"
    return response

# ==========================================
# 1. KONFIGURASI & LOAD MODEL
# ==========================================

GENAI_API_KEY = os.environ.get("GENAI_API_KEY") 
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

chars = string.digits + string.ascii_letters + string.punctuation
opt_dict = {
    'Transformation': 'TPS', 'FeatureExtraction': 'ResNet', 'SequenceModeling': 'BiLSTM', 'Prediction': 'CTC',
    'num_fiducial': 20, 'input_channel': 1, 'output_channel': 512, 'hidden_size': 256,
    'imgH': 32, 'imgW': 160, 'character': chars, 'sensitive': True, 'PAD': True, 'rgb': False, 'batch_max_length': 50
}

class Opts:
    def __init__(self, **entries): 
        self.__dict__.update(entries)
        self.num_class = len(chars) + 1

opt = Opts(**opt_dict)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model_ocr = None
converter = None
reader = None

@app.on_event("startup")
def load_models():
    global model_ocr, converter, reader
    print("⏳ Loading Models...")
    
    converter = CTCLabelConverter(opt.character)
    model_ocr = Model(opt)
    model_ocr = model_ocr.to(device)
    
    model_path = "best_accuracy_final.pth"
    if os.path.exists(model_path):
        state_dict = torch.load(model_path, map_location=device)
        clean_state_dict = {}
        for key, value in state_dict.items():
            new_key = key.replace('module.', '') if key.startswith('module.') else key
            clean_state_dict[new_key] = value
            
        model_ocr.load_state_dict(clean_state_dict)
        model_ocr.eval()
        print("✅ Custom OCR Model Loaded")
    else:
        print("❌ Model .pth not found!")

    reader = easyocr.Reader(['id'], gpu=(device.type == 'cuda'), verbose=False)
    print("✅ EasyOCR Loaded")

def predict_crop_image(crop_img):
    try:
        img = Image.fromarray(cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY))
        w, h = img.size
        ratio = w / float(h)
        resized_w = math.ceil(opt.imgH * ratio)
        if resized_w > opt.imgW: resized_w = opt.imgW
        img = img.resize((resized_w, opt.imgH), Image.BICUBIC)
        transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,), (0.5,))])
        img_tensor = transform(img).unsqueeze(0)
        pad_tensor = torch.zeros(1, 1, opt.imgH, opt.imgW)
        pad_tensor[:, :, :, :resized_w] = img_tensor
        pad_tensor = pad_tensor.to(device)
        
        with torch.no_grad():
            preds = model_ocr(pad_tensor, text=torch.IntTensor(1, opt.batch_max_length).fill_(0), is_train=False)
            _, preds_index = preds.max(2)
            preds_str = converter.decode(preds_index, torch.IntTensor([preds.size(1)]))
            return preds_str[0]
    except Exception:
        return ""

def run_ml_ocr(image):
    start_inference = time.time()
    
    horizontal_list, free_list = reader.detect(image)
    
    cropped_tensors = []
    

    if horizontal_list and len(horizontal_list[0]) > 0:
        for bbox in horizontal_list[0]:
            x_min, x_max = max(0, int(bbox[0])), min(image.shape[1], int(bbox[1]))
            y_min, y_max = max(0, int(bbox[2])), min(image.shape[0], int(bbox[3]))
            
            cropped_image = image[y_min:y_max, x_min:x_max]
            
            if cropped_image.size > 0:
                img = Image.fromarray(cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY))
                w, h = img.size
                ratio = w / float(h)
                resized_w = math.ceil(opt.imgH * ratio)
                if resized_w > opt.imgW: resized_w = opt.imgW
                img = img.resize((resized_w, opt.imgH), Image.BICUBIC)
                
                transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,), (0.5,))])
                img_tensor = transform(img) 
                
                pad_tensor = torch.zeros(1, opt.imgH, opt.imgW)
                pad_tensor[:, :, :resized_w] = img_tensor
                
                cropped_tensors.append(pad_tensor)

    splitify_raw_list = []
    
    if cropped_tensors:
        batch_tensor = torch.stack(cropped_tensors).to(device)
        batch_size = len(cropped_tensors)
        text_tensor = torch.IntTensor(batch_size, opt.batch_max_length).fill_(0)
        
        with torch.no_grad():
            with torch.amp.autocast('cuda'):
                preds = model_ocr(batch_tensor, text=text_tensor, is_train=False)
            
            _, preds_index = preds.max(2)
            preds_str = converter.decode(preds_index, torch.IntTensor([preds.size(1)] * batch_size))
            splitify_raw_list = [pred.strip() for pred in preds_str]

    inference_time = time.time() - start_inference
    
    with open("inference_latency.log", "a") as f:
        f.write(f"{inference_time}\n")

    return "\n".join(splitify_raw_list)

# ==========================================
# 2. ENDPOINT API
# ==========================================
@app.get("/")
def home():
    return RedirectResponse(url="/docs")

@app.get("/lihat-log")
def kalkulasi_log_performa():
    try:
        with open("inference_latency.log", "r") as f:
            lines = f.readlines()
        
        latencies_ms = [float(line.strip()) * 1000 for line in lines if line.strip()]
        
        if not latencies_ms:
            return {"message": "Log masih kosong. Coba test /scan atau /scan-ml dulu!"}
            
        p50 = np.percentile(latencies_ms, 50)
        p90 = np.percentile(latencies_ms, 90)
        p95 = np.percentile(latencies_ms, 95)
        p99 = np.percentile(latencies_ms, 99)
        
        return {
            "status": "success",
            "total_inference_tercatat": len(latencies_ms),
            "P50": f"{p50:.2f} ms",
            "P90": f"{p90:.2f} ms",
            "P95": f"{p95:.2f} ms",
            "P99": f"{p99:.2f} ms",
            "Paling_Cepat": f"{min(latencies_ms):.2f} ms",
            "Paling_Lama": f"{max(latencies_ms):.2f} ms"
        }
    except FileNotFoundError:
        return {"message": "File inference_latency.log belum dibuat. Coba test OCR sekali dulu."}
    
@app.get("/reset-log")
def bersihkan_log():
    try:
        with open("inference_latency.log", "w") as f:
            f.write("")
        return {"status": "success", "message": "Beres Bro! Log latency sudah dikosongkan."}
    except Exception as e:
        return {"status": "error", "message": f"Gagal hapus log: {str(e)}"}

@app.post("/scan-ml")
def scan_ml_only(file: UploadFile = File(...)):
    contents = file.file.read() 
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    full_text = run_ml_ocr(image)
    
    return {
        "status": "success", 
        "message": "ML OCR selesai diproses",
        "raw_text": full_text
    }

@app.post("/scan")
def scan_receipt_full(file: UploadFile = File(...)):
    if not GENAI_API_KEY:
        raise HTTPException(status_code=500, detail="API Key Gemini belum diset di Secret HF")

    contents = file.file.read() 
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    full_text = run_ml_ocr(image)

    structure_template = """
    {
        "items": [
            {
                "name": "Nama Item (String)",
                "price": "Harga Satuan (String dengan titik ribuan, cth: '50.000', kosongkan jika modifier)",
                "qty": "Jumlah (String, cth: '1', kosongkan jika tidak ada info)"
            }
        ],
        "subtotal": "Subtotal (String/Null)",
        "tax": "Pajak/PB1 (String dengan titik, cth: '10.000')",
        "service_charge": "Service Charge (String dengan titik)",
        "total": "Total Bayar (String dengan titik)"
    }
    """

    final_text = f"""
    Kamu adalah parser struk presisi tinggi.
    Tugasmu adalah mengekstrak informasi dari teks OCR struk yang berantakan menjadi JSON yang VALID.

    INSTRUKSI:
    1. Ikuti PERSIS struktur JSON di bawah ini.
    2. Perbaiki typo pada nama menu.
    3. Format harga HARUS String dengan pemisah titik (hapus 'Rp').
    4. Jika data kosong, isi string kosong "" atau null.

    TEMPLATE JSON:
    {structure_template}

    TEKS OCR INPUT (DARI MODEL CUSTOM):
    {full_text}
    """
    
    try:
        model_genai = genai.GenerativeModel(
            model_name='models/gemini-flash-lite-latest', 
            generation_config={"response_mime_type": "application/json"}
        )
        response = model_genai.generate_content(final_text)
        
        clean_json_text = response.text.strip()
        
        if clean_json_text.startswith("```json"):
            clean_json_text = clean_json_text[7:-3]
        elif clean_json_text.startswith("```"):
            clean_json_text = clean_json_text[3:-3]
            
        parsed_data = json.loads(clean_json_text)
        
        return {"status": "success", "data": parsed_data} 

    except Exception as e:
        return {"status": "error", "message": str(e), "raw_ocr": full_text}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7860, workers=4)