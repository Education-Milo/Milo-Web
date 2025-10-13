import React from 'react';
import { typography, type TypographyVariant } from '../../../styles/themes/typography';
import { cn } from '../../../lib/utils';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  color?: string;
}

const TypographyComponent = (props: TypographyProps) => {
  const { variant = 'body', as = 'p', className, color, children, style, ...rest } = props;
  
  // Convertir les styles React Native en classes CSS
  const getTypographyClasses = (variant: TypographyVariant) => {
    const typoStyle = typography[variant];
    const classes = [];
    
    // Convertir fontSize en classes Tailwind
    if (typoStyle.fontSize) {
      const fontSizeMap: Record<number, string> = {
        32: 'text-3xl',
        28: 'text-2xl',
        24: 'text-xl',
        20: 'text-lg',
        18: 'text-lg',
        16: 'text-base',
        14: 'text-sm',
        12: 'text-xs',
        11: 'text-xs'
      };
      classes.push(fontSizeMap[typoStyle.fontSize] || 'text-base');
    }
    
    // Convertir fontWeight
    if (typoStyle.fontWeight) {
      const fontWeightMap: Record<string, string> = {
        '700': 'font-bold',
        '600': 'font-semibold',
        '500': 'font-medium',
        '400': 'font-normal',
        'bold': 'font-bold'
      };
      classes.push(fontWeightMap[typoStyle.fontWeight] || 'font-normal');
    }
    
    // Convertir lineHeight
    if (typoStyle.lineHeight) {
      const lineHeightMap: Record<number, string> = {
        40: 'leading-10',
        36: 'leading-9',
        32: 'leading-8',
        28: 'leading-7',
        26: 'leading-6',
        24: 'leading-6',
        22: 'leading-5',
        20: 'leading-5',
        14: 'leading-3'
      };
      classes.push(lineHeightMap[typoStyle.lineHeight] || 'leading-normal');
    }
    
    // Convertir color
    if (typoStyle.color && typeof typoStyle.color === 'string') {
      const colorMap: Record<string, string> = {
        '#666666': 'text-gray-600',
        '#FFFFFF': 'text-white',
        '#FF8C00': 'text-orange-500',
        '#8E8E93': 'text-gray-500',
        '#11181C': 'text-gray-900'
      };
      classes.push(colorMap[typoStyle.color] || 'text-gray-600');
    }
    
    return classes.join(' ');
  };

  const typographyClasses = getTypographyClasses(variant);
  const colorClass = color ? `text-[${color}]` : '';
  
  const combinedStyle = {
    ...style,
    ...(color && { color })
  };

  const Component = as;
  
  return React.createElement(
    Component,
    {
      className: cn(typographyClasses, colorClass, className),
      style: combinedStyle,
      ...rest
    },
    children
  );
};

export default TypographyComponent;