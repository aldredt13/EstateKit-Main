export default function TestimonialImage({ src, alt, credit }) {
  return (
    <figure className="mx-auto">
      <img
        src={src}
        className="max-w-sm w-full mx-auto h-auto drop-shadow"
        loading="lazy"
        decoding="async"
        alt={
          alt ||
          (credit
            ? `${credit.name} — ${credit.caption}`
            : "EstateKit client results screenshot")
        }
      />
      {credit && (
        <div className="flex mx-auto w-fit items-center gap-2 mt-2">
          <img
            src={credit.img}
            alt={credit.name}
            className="h-10 w-10 object-cover rounded-full"
          />
          <figcaption className="font-semibold text-gray-700">
            {credit.name} — {credit.caption}
          </figcaption>
        </div>
      )}
    </figure>
  );
}
