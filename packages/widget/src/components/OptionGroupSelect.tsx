import React, { useMemo } from 'react';
import type { OptionGroup, OptionChoice } from '../types';

interface OptionGroupSelectProps {
  group: OptionGroup;
  value: string | null;
  onChange: (choiceId: string | null) => void;
  currency: string;
}

/**
 * Accessible dropdown component for option group selection.
 *
 * - Uses native HTML <select> for accessibility and mobile support
 * - Shows modifier labels with formatted prices: (+$15.00) or (+10%)
 * - REQUIRED groups: asterisk in label, disabled placeholder option
 * - OPTIONAL groups: "None" as first option
 */
export function OptionGroupSelect(props: OptionGroupSelectProps) {
  const { group, value, onChange, currency } = props;

  // Memoize Intl.NumberFormat instance
  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
    });
  }, [currency]);

  return (
    <div className="pm-option-group">
      <label
        htmlFor={`pm-option-${group.id}`}
        className="pm-option-label"
      >
        {group.name}{group.requirement === 'REQUIRED' ? ' *' : ''}
      </label>
      <select
        id={`pm-option-${group.id}`}
        className="pm-option-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        required={group.requirement === 'REQUIRED'}
        aria-required={group.requirement === 'REQUIRED'}
      >
        {group.requirement === 'OPTIONAL' ? (
          <option value="">None</option>
        ) : (
          <option value="" disabled>
            Select {group.name}...
          </option>
        )}
        {group.choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label} {formatModifier(choice, currencyFormatter)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Format price modifier label for display.
 *
 * - Zero modifiers: empty string
 * - FIXED: (+$15.00) in currency format
 * - PERCENTAGE: (+10%) as whole number percent
 */
function formatModifier(
  choice: OptionChoice,
  currencyFormatter: Intl.NumberFormat
): string {
  if (choice.modifierValue === 0) {
    return '';
  }

  if (choice.modifierType === 'FIXED') {
    // Convert cents to dollars
    const dollars = choice.modifierValue / 100;
    const formatted = currencyFormatter.format(Math.abs(dollars));
    const sign = choice.modifierValue > 0 ? '+' : '-';
    return `(${sign}${formatted})`;
  }

  if (choice.modifierType === 'PERCENTAGE') {
    // Convert basis points to percent
    const percent = choice.modifierValue / 100;
    const sign = choice.modifierValue > 0 ? '+' : '-';
    return `(${sign}${Math.abs(percent).toFixed(0)}%)`;
  }

  return '';
}
