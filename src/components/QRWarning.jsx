export default function QRWarning({ warnings, active }) {
  if (!active) return null;

  if (warnings.length === 0) {
    return (
      <p className="notice notice-ok" role="status">
        No scanning problems found with these settings.
      </p>
    );
  }

  return (
    <ul className="warnings" aria-label="Scan reliability" role="status">
      {warnings.map((w) => (
        <li key={w.id} className={`notice notice-${w.level}`}>
          {w.message}
        </li>
      ))}
    </ul>
  );
}
