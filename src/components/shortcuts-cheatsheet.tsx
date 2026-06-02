'use client'

import { Fragment } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Kbd } from "@/components/ui/kbd"

type ShortcutGroup = 'Navigation' | 'Editing' | 'Coach'

interface Shortcut {
    keys: string[]
    description: string
    group: ShortcutGroup
}

const SHORTCUTS: Shortcut[] = [
    { keys: ['Cmd/Ctrl', 'K'], description: 'Open command palette', group: 'Navigation' },
    { keys: ['?'], description: 'Open this cheat sheet', group: 'Navigation' },
    { keys: ['Escape'], description: 'Close any open floating panel', group: 'Navigation' },
    { keys: ['Cmd/Ctrl', 'Click'], description: 'Multi-select notes (on a note row)', group: 'Editing' },
    { keys: ['Cmd/Ctrl', 'Enter'], description: 'Send message in Coach chat', group: 'Coach' },
]

const GROUP_ORDER: ShortcutGroup[] = ['Navigation', 'Editing', 'Coach']

export function ShortcutsCheatsheet({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {GROUP_ORDER.map((group) => {
                        const items = SHORTCUTS.filter((s) => s.group === group)
                        if (items.length === 0) return null

                        return (
                            <div key={group} className="space-y-2 border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{group}</h3>
                                <ul className="space-y-1.5">
                                    {items.map((shortcut) => (
                                        <li key={shortcut.description} className="flex items-center justify-between gap-4">
                                            <span className="text-sm text-zinc-700">{shortcut.description}</span>
                                            <span className="flex shrink-0 items-center">
                                                {shortcut.keys.map((key, i) => (
                                                    <Fragment key={key}>
                                                        {i > 0 && <span className="mx-0.5 text-zinc-400">+</span>}
                                                        <Kbd>{key}</Kbd>
                                                    </Fragment>
                                                ))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
