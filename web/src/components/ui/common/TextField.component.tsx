import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '@styles/TextField.component.css';

interface TextFieldComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  type?: 'email' | 'password' | 'text';
  error?: string;
}

const TextFieldComponent = forwardRef<HTMLInputElement, TextFieldComponentProps>(
  (props, ref) => {
    const { className, icon, type, error, disabled, ...rest } = props;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    return (
      <div className="textfield-container">
        <div className={`textfield-input-icon-container ${disabled ? 'textfield-disabled' : ''}`}>
          {icon && <div className="textfield-icon-container">{icon}</div>}
          <input
            ref={ref}
            {...rest}
            disabled={disabled}
            className={`textfield-input ${disabled ? 'textfield-input-disabled' : ''} ${className || ''}`}
            type={type === 'password' && !isPasswordVisible ? 'password' : type === 'email' ? 'email' : 'text'}
            placeholder={rest.placeholder}
          />
          {type === 'password' && !disabled && (
            <button
              type="button"
              className="textfield-right-icon-container"
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <Eye size={20} color='#666' />
              ) : (
                <EyeOff size={20} color='#666' />
              )}
            </button>
          )}
        </div>
        {error && (
          <div className="textfield-error-text">
            {error}
          </div>
        )}
      </div>
    );
  }
);

TextFieldComponent.displayName = 'TextFieldComponent';

export default TextFieldComponent;
