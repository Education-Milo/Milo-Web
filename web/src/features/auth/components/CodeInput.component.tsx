import React, { useRef } from "react";

interface CodeInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
	disabled?: boolean;
	error?: string;
	autoFocus?: boolean;
}

/**
 * Saisie d'un code numérique en cases séparées (une par chiffre), avec
 * clavier numérique sur mobile, collage du code complet et navigation
 * au clavier entre les cases.
 */
const CodeInput: React.FC<CodeInputProps> = ({
	value,
	onChange,
	length = 6,
	disabled = false,
	error,
	autoFocus = false,
}) => {
	const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
	const digits = Array.from({ length }, (_, i) => value[i] ?? "");

	const focusAt = (index: number) => {
		const clamped = Math.max(0, Math.min(length - 1, index));
		inputsRef.current[clamped]?.focus();
		inputsRef.current[clamped]?.select();
	};

	const setDigit = (index: number, digit: string) => {
		const next = digits.slice();
		next[index] = digit;
		onChange(next.join(""));
	};

	const handleChange = (index: number, raw: string) => {
		const cleaned = raw.replace(/\D/g, "");
		if (!cleaned) {
			setDigit(index, "");
			return;
		}
		// Plusieurs chiffres d'un coup (collage, autocomplétion SMS) : on remplit à partir de la case
		if (cleaned.length > 1) {
			const merged = (value.slice(0, index) + cleaned).slice(0, length);
			onChange(merged);
			focusAt(merged.length >= length ? length - 1 : merged.length);
			return;
		}
		setDigit(index, cleaned);
		if (index < length - 1) focusAt(index + 1);
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace") {
			if (digits[index]) {
				setDigit(index, "");
			} else if (index > 0) {
				setDigit(index - 1, "");
				focusAt(index - 1);
			}
			e.preventDefault();
		} else if (e.key === "ArrowLeft") {
			focusAt(index - 1);
			e.preventDefault();
		} else if (e.key === "ArrowRight") {
			focusAt(index + 1);
			e.preventDefault();
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
		if (!pasted) return;
		e.preventDefault();
		onChange(pasted);
		focusAt(pasted.length >= length ? length - 1 : pasted.length);
	};

	return (
		<div className="code-input">
			<div className={`code-input-boxes ${error ? "has-error" : ""}`} role="group" aria-label="Code de confirmation">
				{digits.map((digit, index) => (
					<input
						key={index}
						ref={(el) => {
							inputsRef.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						autoComplete={index === 0 ? "one-time-code" : "off"}
						maxLength={length}
						value={digit}
						disabled={disabled}
						autoFocus={autoFocus && index === 0}
						aria-label={`Chiffre ${index + 1} sur ${length}`}
						className="code-input-box"
						onChange={(e) => handleChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onPaste={handlePaste}
						onFocus={(e) => e.target.select()}
					/>
				))}
			</div>
			{error && <p className="forgot-error-text code-input-error">{error}</p>}
		</div>
	);
};

export default CodeInput;
