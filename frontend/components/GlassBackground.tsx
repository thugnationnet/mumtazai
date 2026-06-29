export default function GlassBackground() {
  return (
    <div className="glass-bg-shapes" aria-hidden="true">
      <div className="glass-snake glass-snake-1" />
      <div className="glass-snake glass-snake-2" />
      <div className="glass-orb" style={{ top: '10%', right: '10%' }} />
      <div className="glass-orb" style={{ bottom: '20%', left: '10%' }} />
    </div>
  );
}
