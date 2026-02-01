import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
}) => {
  const baseClasses = 'font-["supermolot"] cursor-pointer transition-all duration-300 ease-in-out transform rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 active:scale-95';

  const variants = {
    primary: 'bg-[#CD78EC] text-white hover:bg-[#b85cd6] focus:ring-[#CD78EC]',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-400',
    outline: 'border-2 border-[#CD78EC] text-[#CD78EC] bg-transparent hover:bg-[#CD78EC] hover:text-white focus:ring-[#CD78EC]',
  };

  const sizes = {
    sm: 'text-[16px] py-[8px] px-[16px]',
    md: 'text-[20px] py-[10px] px-[20px]',
    lg: 'text-[28px] py-[12px] px-[24px]',
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClass} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;