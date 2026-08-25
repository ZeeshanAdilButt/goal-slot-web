import assert from 'node:assert/strict'

import { test } from 'vitest'

import { buildScene, isSceneSafeToPersist } from './scene.ts'

const IMAGE_BLOB = 'data:image/png;base64,' + 'A'.repeat(64)

function imageElement(id: string, fileId: string, extra: Record<string, unknown> = {}) {
  return { id, type: 'image', fileId, ...extra }
}

test('buildScene drops deleted-element tombstones', () => {
  const scene = buildScene(
    [
      { id: 'a', type: 'rectangle' },
      { id: 'b', type: 'rectangle', isDeleted: true },
    ],
    {},
    {},
  )

  assert.deepEqual(
    scene.elements.map((el) => el.id),
    ['a'],
  )
})

test('buildScene drops the blob of a deleted image', () => {
  // Excalidraw hands onChange its raw file map. Delete an image and the
  // element gets a tombstone, but the base64 blob stays — and would be
  // restored via initialData.files on the next open and re-saved forever.
  const scene = buildScene(
    [imageElement('img-1', 'file-1', { isDeleted: true })],
    {},
    { 'file-1': { dataURL: IMAGE_BLOB } },
  )

  assert.deepEqual(scene.elements, [])
  assert.deepEqual(scene.files, {}, 'orphaned image blob must not be persisted')
})

test('buildScene keeps files that a live element still references', () => {
  const scene = buildScene(
    [imageElement('img-1', 'file-live'), imageElement('img-2', 'file-gone', { isDeleted: true })],
    {},
    { 'file-live': { dataURL: IMAGE_BLOB }, 'file-gone': { dataURL: IMAGE_BLOB } },
  )

  assert.deepEqual(Object.keys(scene.files), ['file-live'])
})

test('buildScene drops a file no element ever referenced', () => {
  const scene = buildScene([{ id: 'a', type: 'rectangle' }], {}, { orphan: { dataURL: IMAGE_BLOB } })

  assert.deepEqual(scene.files, {})
})

test('buildScene strips volatile appState but keeps the rest', () => {
  const scene = buildScene([], {
    collaborators: new Map(),
    editingElement: {},
    draggingElement: {},
    openMenu: 'shape',
    openPopup: 'x',
    contextMenu: {},
    scrollX: 42,
    viewBackgroundColor: '#fff',
  })

  assert.deepEqual(scene.appState, { scrollX: 42, viewBackgroundColor: '#fff' })
})

test('buildScene tolerates a missing file map', () => {
  const scene = buildScene([{ id: 'a', type: 'rectangle' }], {}, undefined as unknown as Record<string, unknown>)
  assert.deepEqual(scene.files, {})
})

test('isSceneSafeToPersist blocks an empty scene from a canvas that never held content', () => {
  // The data-loss case: the detail request failed, the canvas mounted empty,
  // and an autosave is about to PUT nothing over a real board.
  assert.equal(isSceneSafeToPersist({ elements: [] }, false), false)
})

test('isSceneSafeToPersist allows a genuine clear-the-board', () => {
  assert.equal(isSceneSafeToPersist({ elements: [] }, true), true)
})

test('isSceneSafeToPersist always allows a non-empty scene', () => {
  assert.equal(isSceneSafeToPersist({ elements: [{ id: 'a' }] }, false), true)
})
