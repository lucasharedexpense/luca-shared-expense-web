// components/ui/SearchBar.tsx
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-5 py-6 h-22.5 flex items-center justify-center">
      <div className="w-full bg-white rounded-4xl flex items-center px-4 py-3 shadow-sm">
        <Search className="text-black w-5 h-5 mr-3" />
        <input
          type="text"
          placeholder="Search events..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-black placeholder-gray-400"
        />
      </div>
    </div>
  );
}