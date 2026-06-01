/* By using this routine(function) this we can guard the single-letter shortcuts (Ctrl + C, Ctrl + B, Ctrl + V etc) so they don't take place of the shortcuts that are made for any editor */

export function isTypingTarget(target:EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false

    const tag = target.tagName

    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true

    if(target.isContentEditable) return true
    return false
}