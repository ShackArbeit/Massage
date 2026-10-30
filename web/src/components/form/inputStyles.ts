export function inputClass(invalid: boolean): string {
  return `block w-full rounded-xl border bg-white px-3.5 text-base text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:ring-2 ${
    invalid ? "border-red-500 focus:ring-red-500/20" : "border-stone-300 focus:border-teal-600 focus:ring-teal-600/20"
  }`;
}
