/**
 * WistiaPlayer
 *
 * Renders the <wistia-player> custom element.
 * React 18 passes unknown props straight through to the DOM on custom elements,
 * so we just spread the props. The Wistia embed scripts loaded in index.html
 * upgrade the element once they initialise.
 */
export default function WistiaPlayer({ mediaId, aspect = '1.7777777777777777' }) {
  return (
    <wistia-player
      media-id={mediaId}
      aspect={aspect}
      style={{ display: 'block', width: '100%' }}
    />
  )
}
