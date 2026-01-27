import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { completed, notes } = body

    const updateData: any = {}
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }
    if (notes !== undefined) updateData.notes = notes

    const followUp = await prisma.followUp.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(followUp)
  } catch (error) {
    console.error('Error updating follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to update follow-up' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.followUp.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to delete follow-up' },
      { status: 500 }
    )
  }
}
