 import { useState, useEffect, useRef } from "react";
 import { Search, Loader2, Gamepad2 } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Link, useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { usePricing } from "@/lib/pricing";
 
 interface SearchResult {
   kinguin_id: number;
   name: string;
   cover_image: string | null;
   sell_price: number;
   platform: string | null;
   margin_percent: number | null;
 }
 
 interface SearchDropdownProps {
   className?: string;
 }
 
 const SearchDropdown = ({ className }: SearchDropdownProps) => {
   const [query, setQuery] = useState("");
   const [results, setResults] = useState<SearchResult[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isOpen, setIsOpen] = useState(false);
   const [selectedIndex, setSelectedIndex] = useState(-1);
   const inputRef = useRef<HTMLInputElement>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const navigate = useNavigate();
   const { getPrice, formatDKK } = usePricing();
 
   // Debounced search
   useEffect(() => {
     if (query.length < 2) {
       setResults([]);
       setIsOpen(false);
       return;
     }
 
     const timeoutId = setTimeout(async () => {
       setIsLoading(true);
       try {
         const { data, error } = await supabase
           .from("kinguin_products")
           .select("kinguin_id, name, cover_image, sell_price, platform, margin_percent")
           .ilike("name", `%${query}%`)
           .eq("is_available", true)
           .order("name")
           .limit(6);
 
         if (!error && data) {
           setResults(data);
           setIsOpen(true);
           setSelectedIndex(-1);
         }
       } catch (err) {
         console.error("Search error:", err);
       } finally {
         setIsLoading(false);
       }
     }, 250);
 
     return () => clearTimeout(timeoutId);
   }, [query]);
 
   // Close dropdown on click outside
   useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
         setIsOpen(false);
       }
     };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);
 
   // Keyboard navigation
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (!isOpen) return;
 
     switch (e.key) {
       case "ArrowDown":
         e.preventDefault();
         setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
         break;
       case "ArrowUp":
         e.preventDefault();
         setSelectedIndex((prev) => Math.max(prev - 1, -1));
         break;
       case "Enter":
         e.preventDefault();
         if (selectedIndex >= 0 && results[selectedIndex]) {
           navigate(`/product/${results[selectedIndex].kinguin_id}`);
           setQuery("");
           setIsOpen(false);
         } else if (query.trim()) {
           navigate(`/search?q=${encodeURIComponent(query.trim())}`);
           setQuery("");
           setIsOpen(false);
         }
         break;
       case "Escape":
         setIsOpen(false);
         inputRef.current?.blur();
         break;
     }
   };
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (query.trim()) {
       navigate(`/search?q=${encodeURIComponent(query.trim())}`);
       setQuery("");
       setIsOpen(false);
     }
   };
 
   return (
     <div ref={dropdownRef} className={`relative ${className}`}>
       <form onSubmit={handleSubmit} className="relative group">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
         <input
           ref={inputRef}
           type="text"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           onKeyDown={handleKeyDown}
           onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
           placeholder="Søg efter spil..."
           className="w-56 lg:w-64 h-10 pl-10 pr-10 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-muted transition-all focus:ring-2 focus:ring-primary/20"
           autoComplete="off"
         />
         {isLoading && (
           <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
         )}
       </form>
 
       <AnimatePresence>
         {isOpen && results.length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: -10, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -10, scale: 0.95 }}
             transition={{ duration: 0.15 }}
             className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50"
           >
             <div className="p-1.5">
               {results.map((result, index) => (
                 <Link
                   key={result.kinguin_id}
                   to={`/product/${result.kinguin_id}`}
                   onClick={() => {
                     setQuery("");
                     setIsOpen(false);
                   }}
                   className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                     selectedIndex === index
                       ? "bg-primary/10"
                       : "hover:bg-muted"
                   }`}
                 >
                   {/* Thumbnail */}
                   <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                     {result.cover_image ? (
                       <img
                         src={result.cover_image}
                         alt={result.name}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center">
                         <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                       </div>
                     )}
                   </div>
 
                   {/* Info */}
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-foreground truncate">
                       {result.name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {result.platform || "PC"}
                     </p>
                   </div>
 
                   {/* Price */}
                   <span className="text-sm font-semibold text-primary shrink-0">
                     {formatDKK(getPrice(result.sell_price, result.margin_percent))}
                   </span>
                 </Link>
               ))}
             </div>
 
             {/* View all results */}
             <div className="border-t border-border p-2">
               <Link
                 to={`/search?q=${encodeURIComponent(query)}`}
                 onClick={() => {
                   setQuery("");
                   setIsOpen(false);
                 }}
                 className="flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
               >
                 <Search className="w-4 h-4" />
                 Se alle resultater for "{query}"
               </Link>
             </div>
           </motion.div>
         )}
 
         {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl p-4 z-50"
           >
             <p className="text-sm text-muted-foreground text-center">
               Ingen resultater for "{query}"
             </p>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 };
 
 export default SearchDropdown;