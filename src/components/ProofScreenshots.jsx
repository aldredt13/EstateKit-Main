import screenshot1 from '../../assets/Screenshot 2026-04-14 003644.png'
import screenshot2 from '../../assets/Screenshot 2026-04-14 003721.png'
import screenshot3 from '../../assets/Screenshot 2026-04-14 003812.png'
import screenshot4 from '../../assets/Screenshot 2026-04-14 003933.png'
import screenshot5 from '../../assets/Screenshot 2026-04-14 004026.png'
import screenshot6 from '../../assets/Screenshot 2026-04-14 003644.png'

const SCREENSHOTS = [
  screenshot1,
  screenshot2,
  screenshot3,
  screenshot4,
  screenshot5,
  screenshot6,
]

export default function ProofScreenshots() {
  return (
    <section className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pb-10 md:pb-12">
      <p className="text-center text-slate-900 font-bold text-xl md:text-3xl mb-5">
        Get appointment texts like these daily...
      </p>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {SCREENSHOTS.map((src, i) => (
          <div key={i} className="mx-auto">
            <img src={src} height="200" style={{ width: 'auto' }} alt={`Proof screenshot ${i + 1}`} />
          </div>
        ))}
      </div>
    </section>
  )
}
