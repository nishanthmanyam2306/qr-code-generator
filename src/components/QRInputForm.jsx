import { useState } from 'react';
import ErrorMessage from './ErrorMessage';
import { LIMITS } from '../utils/validation';

function Field({ id, label, error, hint, children }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      <ErrorMessage id={`${id}-error`} message={error} />
    </div>
  );
}

/**
 * Shows the inputs for the selected QR type. An error appears once the user has
 * left a field or started typing in it, so a fresh form is not covered in red.
 * The parent gives this component key={type} so that state resets when the type changes.
 */
export default function QRInputForm({ type, data, errors, onChange }) {
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const errorFor = (name) => {
    const hasValue = String(data[name] ?? '') !== '' && data[name] !== false;
    return touched[name] || hasValue ? errors[name] : '';
  };

  const bind = (name) => {
    const id = `field-${name}`;
    const error = errorFor(name);
    return {
      id,
      value: data[name] ?? '',
      onChange: (e) => onChange({ [name]: e.target.value }),
      onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': error ? `${id}-error` : undefined,
    };
  };

  if (type === 'url') {
    return (
      <Field id="field-url" label="Web address" error={errorFor('url')} hint="https:// is added for you if you leave it out.">
        <input type="text" inputMode="url" autoComplete="off" placeholder="example.com" {...bind('url')} />
      </Field>
    );
  }

  if (type === 'text') {
    const length = (data.text || '').length;
    return (
      <Field id="field-text" label="Text" error={errorFor('text')} hint={`${length} / ${LIMITS.text} characters`}>
        <textarea rows={5} placeholder="Anything you like: a note, a message, a code…" {...bind('text')} />
      </Field>
    );
  }

  if (type === 'email') {
    return (
      <>
        <Field id="field-address" label="Email address" error={errorFor('address')}>
          <input type="email" autoComplete="off" placeholder="name@example.com" {...bind('address')} />
        </Field>
        <Field id="field-subject" label="Subject (optional)" error={errorFor('subject')}>
          <input type="text" {...bind('subject')} />
        </Field>
        <Field id="field-body" label="Message (optional)" error={errorFor('body')}>
          <textarea rows={3} {...bind('body')} />
        </Field>
      </>
    );
  }

  if (type === 'phone') {
    return (
      <Field id="field-phone" label="Phone number" error={errorFor('phone')} hint="Include the country code for numbers used abroad, like +91.">
        <input type="tel" autoComplete="off" placeholder="+91 98765 43210" {...bind('phone')} />
      </Field>
    );
  }

  // Wi-Fi
  const open = data.encryption === 'nopass';
  return (
    <>
      <Field id="field-ssid" label="Network name" error={errorFor('ssid')}>
        <input type="text" autoComplete="off" {...bind('ssid')} />
      </Field>
      <Field id="field-encryption" label="Security" error={errorFor('encryption')}>
        <select {...bind('encryption')}>
          <option value="WPA">WPA / WPA2 / WPA3</option>
          <option value="WEP">WEP</option>
          <option value="nopass">None (open network)</option>
        </select>
      </Field>
      {!open && (
        <Field id="field-password" label="Password" error={errorFor('password')}>
          <input type={showPassword ? 'text' : 'password'} autoComplete="off" {...bind('password')} />
          <label className="check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>
        </Field>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={!!data.hidden}
          onChange={(e) => onChange({ hidden: e.target.checked })}
        />
        This is a hidden network
      </label>
    </>
  );
}
