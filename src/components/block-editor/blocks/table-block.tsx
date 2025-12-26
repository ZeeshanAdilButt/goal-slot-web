'use client'

import { useState, useRef, useEffect } from 'react'

import { Plus, Trash2 } from 'lucide-react'

import { TableBlock, TableRow } from '../types'
import { useBlockEditorStore } from '../store'

import { cn } from '@/lib/utils'

interface TableBlockComponentProps {
  block: TableBlock
  isSelected: boolean
  onSelect: () => void
}

export function TableBlockComponent({ block, isSelected, onSelect }: TableBlockComponentProps) {
  const { updateBlock } = useBlockEditorStore()
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...block.headers]
    newHeaders[index] = value
    updateBlock(block.id, { headers: newHeaders })
  }

  const updateCell = (rowId: string, cellIndex: number, value: string) => {
    const newRows = block.rows.map((row) =>
      row.id === rowId
        ? { ...row, cells: row.cells.map((cell, i) => (i === cellIndex ? value : cell)) }
        : row
    )
    updateBlock(block.id, { rows: newRows })
  }

  const addRow = () => {
    const newRow: TableRow = {
      id: crypto.randomUUID(),
      cells: Array(block.headers.length).fill(''),
    }
    updateBlock(block.id, { rows: [...block.rows, newRow] })
  }

  const deleteRow = (rowId: string) => {
    if (block.rows.length <= 1) return
    updateBlock(block.id, { rows: block.rows.filter((row) => row.id !== rowId) })
  }

  const addColumn = () => {
    const newHeaders = [...block.headers, `Column ${block.headers.length + 1}`]
    const newRows = block.rows.map((row) => ({
      ...row,
      cells: [...row.cells, ''],
    }))
    updateBlock(block.id, { headers: newHeaders, rows: newRows })
  }

  const deleteColumn = (index: number) => {
    if (block.headers.length <= 1) return
    const newHeaders = block.headers.filter((_, i) => i !== index)
    const newRows = block.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== index),
    }))
    updateBlock(block.id, { headers: newHeaders, rows: newRows })
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse overflow-hidden rounded-lg border-4 border-black bg-white">
          {/* Headers */}
          <thead>
            <tr className="bg-primary">
              {block.headers.map((header, index) => (
                <th
                  key={index}
                  className="relative border-b-4 border-r-2 border-black p-0 last:border-r-0"
                  onMouseEnter={() => setHoveredColumn(index)}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => updateHeader(index, e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-left text-sm font-black text-black outline-none placeholder:text-black/50"
                    placeholder="Header"
                  />
                  {hoveredColumn === index && block.headers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteColumn(index)
                      }}
                      className="absolute -top-2 right-1 flex h-5 w-5 items-center justify-center border-2 border-black bg-red-500 text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </th>
              ))}
              <th className="w-10 border-b-4 border-black bg-primary/80 p-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addColumn()
                  }}
                  className="flex h-full w-full items-center justify-center p-2 text-black hover:bg-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className="group/row hover:bg-gray-50"
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b-2 border-r-2 border-black p-0 last:border-r-0"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(row.id, cellIndex, e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-sm text-black outline-none placeholder:text-gray-400"
                      placeholder="Enter text..."
                    />
                  </td>
                ))}
                <td className="w-10 border-b-2 border-black bg-gray-100 p-0">
                  {hoveredRow === rowIndex && block.rows.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRow(row.id)
                      }}
                      className="flex h-full w-full items-center justify-center p-2 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {/* Add row button */}
            <tr>
              <td colSpan={block.headers.length + 1} className="p-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addRow()
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t-2 border-black bg-gray-50 p-2 text-sm font-bold text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                  Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
