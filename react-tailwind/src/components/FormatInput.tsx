import { InputHTMLAttributes, ChangeEvent, KeyboardEvent, useState, useCallback } from 'react';

interface FormatInputProps extends InputHTMLAttributes<HTMLInputElement> {
  format: string;
}

function handleInput(format: string, e: ChangeEvent<HTMLInputElement>) {
  const { value } = e.target;
  const numbers = value.replace(/\D/g, '').split('');
  let end = 0;
  const formatted = format
    .split('')
    .map((char, i) => {
      if (char === '#') {
        const num = numbers.shift();
        if (num) end = i + 1;
        return num || '#';
      }
      return char;
    })
    .join('');
  return formatted.substring(0, end);
}

function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (
    ![
      'Backspace',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Delete',
      'Tab',
      'Enter',
    ].includes(e.key) &&
    isNaN(Number(e.key))
  ) {
    if (!(e.code === 'KeyV' && (e.getModifierState('Meta') || e.getModifierState('Control')))) {
      e.preventDefault();
    }
  }
}

function FormatInput(props: FormatInputProps) {
  const { format, ...rest } = props;
  const [value, setValue] = useState('');
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { selectionStart } = e.target;
      setValue(handleInput(format, e));
      e.target.setSelectionRange(selectionStart, selectionStart);
    },
    [format, setValue],
  );
  return (
    <input
      placeholder={format}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onSelect={() => console.log('select')}
      value={value}
      {...rest}
    />
  );
}

export { FormatInput };
export const PhoneInput = () => <FormatInput format="###-###-####" />;
export const SSNInput = () => <FormatInput format="###-##-####" />;
export const ZipInput = () => <FormatInput format="#####-####" />;
export const DateInput = () => <FormatInput format="##/##/####" />;
export const TimeInput = () => <FormatInput format="##:##" />;
