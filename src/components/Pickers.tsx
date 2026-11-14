import { TRADES } from "@/lib/trades";

export function TradePicker({ selected }: { selected: string[] }) {
  return (
    <div className="chips">
      {TRADES.map((t) => (
        <label key={t.id} className="chip">
          <input type="checkbox" name="trades" value={t.id} defaultChecked={selected.includes(t.id)} />
          <span>{t.label}</span>
        </label>
      ))}
    </div>
  );
}

export function ZipPicker({ zips, selected }: { zips: string[]; selected: string[] }) {
  return (
    <div className="chips zipgrid">
      {zips.map((z) => (
        <label key={z} className="chip">
          <input type="checkbox" name="zips" value={z} defaultChecked={selected.includes(z)} />
          <span>{z}</span>
        </label>
      ))}
    </div>
  );
}
