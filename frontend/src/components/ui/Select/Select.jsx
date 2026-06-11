import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "react-bootstrap-icons";

const normalizeOption = (option) =>
  typeof option === "object"
    ? {
        label: String(option.label),
        value: option.value,
      }
    : {
        label: String(option),
        value: option,
      };

function Select({
  label,
  error,
  options = [],
  placeholder,
  className = "",
  id,
  name,
  onChange,
  value = "",
  disabled = false,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [normalizedOptions, searchTerm]);
  const selectedOption = normalizedOptions.find((option) => option.value === value) || null;
  const activeOption = filteredOptions[activeIndex];
  const displayValue = selectedOption?.label || placeholder || "Select an option";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!buttonRef.current?.contains(event.target) && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setActiveIndex(0);
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const emitChange = (nextValue) => {
    onChange?.({
      target: {
        name,
        value: nextValue,
      },
    });
  };

  const chooseOption = (option) => {
    emitChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (disabled) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((currentIndex) => Math.max(0, Math.min(currentIndex + 1, filteredOptions.length - 1)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      if (activeOption) {
        chooseOption(activeOption);
      }
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(0, Math.min(currentIndex + 1, filteredOptions.length - 1)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeOption) {
        chooseOption(activeOption);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label ? (
        <span className="mb-2 block text-sm font-extrabold text-brand-forest" id={`${selectId}-label`}>
          {label}
        </span>
      ) : null}
      <input name={name} type="hidden" value={value} />
      <button
        aria-activedescendant={isOpen && activeOption ? `${selectId}-option-${activeIndex}` : undefined}
        aria-controls={`${selectId}-listbox`}
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={Boolean(error)}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        className="flex min-h-12 w-full items-center justify-between gap-3 border border-brand-forest/15 bg-white px-4 text-left text-brand-charcoal shadow-sm transition hover:border-brand-gold/60 focus:border-brand-forest/15 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        id={selectId}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        type="button"
      >
        <span className={selectedOption ? "truncate" : "truncate text-brand-muted/70"}>{displayValue}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-brand-gold transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden border border-brand-forest/10 bg-white shadow-[0_18px_55px_rgba(6,63,44,0.18)]"
          ref={dropdownRef}
        >
          <div className="border-b border-brand-forest/10 p-2">
            <div className="relative">
              <input
                aria-label={`Search ${label || "options"}`}
                autoComplete="on"
                className="min-h-10 w-full appearance-none border border-brand-forest/15 bg-brand-cream/40 px-3 pr-10 text-sm text-brand-charcoal placeholder:text-brand-muted/70 focus:border-brand-forest/15 focus:outline-none focus:ring-0"
                list={`${selectId}-autocomplete`}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search options"
                ref={searchRef}
                type="text"
                value={searchTerm}
              />
              <datalist id={`${selectId}-autocomplete`}>
                {normalizedOptions.map((option) => (
                  <option key={option.value} value={option.label} />
                ))}
              </datalist>
              {searchTerm ? (
                <button
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-brand-muted transition hover:bg-brand-cream hover:text-brand-forest focus:outline-none focus:ring-0"
                  onClick={() => {
                    setSearchTerm("");
                    searchRef.current?.focus();
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
          <ul
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className="max-h-56 overflow-y-auto p-1"
            id={`${selectId}-listbox`}
            role="listbox"
            tabIndex={-1}
          >
            {placeholder && !searchTerm ? (
              <li
                aria-selected={value === ""}
                className={`cursor-pointer px-3 py-2.5 text-sm font-semibold transition ${
                  value === "" ? "bg-brand-forest text-white" : "text-brand-muted hover:bg-brand-cream"
                }`}
                id={`${selectId}-option-placeholder`}
                onClick={() => chooseOption({ label: placeholder, value: "" })}
                role="option"
              >
                {placeholder}
              </li>
            ) : null}
            {filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li
                  aria-selected={isSelected}
                  className={`cursor-pointer px-3 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-brand-forest text-white"
                      : isActive
                        ? "bg-brand-cream text-brand-forest"
                        : "text-brand-charcoal hover:bg-brand-cream"
                  }`}
                  id={`${selectId}-option-${index}`}
                  key={option.value}
                  onClick={() => chooseOption(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                >
                  {option.label}
                </li>
              );
            })}
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-sm font-semibold text-brand-muted">No matching options</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-700" id={`${selectId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Select;
