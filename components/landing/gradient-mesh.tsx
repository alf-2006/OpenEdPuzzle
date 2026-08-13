/**
 * GradientMesh — pure CSS animated background. Three blurred blobs drifting
 * on offset durations. No canvas, no JS, no images.
 */
export function GradientMesh() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="mesh-blob animate-blob-drift left-[8%] top-[12%] h-[38rem] w-[38rem] bg-primary/20 motion-reduce:animate-none" />
      <div className="mesh-blob animate-blob-drift right-[4%] top-[38%] h-[30rem] w-[30rem] bg-accent/20 [animation-delay:-7s] [animation-duration:26s] motion-reduce:animate-none" />
      <div className="mesh-blob animate-blob-drift bottom-[8%] left-[32%] h-[34rem] w-[34rem] bg-primary/10 [animation-delay:-14s] [animation-duration:32s] motion-reduce:animate-none" />
    </div>
  );
}
