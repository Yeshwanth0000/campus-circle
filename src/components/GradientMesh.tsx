export default function GradientMesh() {
  return (
    <div aria-hidden className="gradient-mesh pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      <div className="mesh-blob mesh-blob-4" />
      <div className="mesh-grain" />
    </div>
  );
}
