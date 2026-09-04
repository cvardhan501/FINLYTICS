import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Asset } from '@/models/Asset';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { assetSchema } from '@/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = assetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const updatedAsset = await Asset.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      {
        name: result.data.name,
        type: result.data.type,
        amount: result.data.amount,
        date: result.data.date ? new Date(result.data.date) : new Date(),
        notes: result.data.notes || '',
        attachment: result.data.attachment || '',
        loanId: result.data.loanId || null,
      },
      { new: true }
    );

    if (!updatedAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Asset updated successfully',
      asset: { ...updatedAsset.toObject(), id: updatedAsset._id.toString() },
    });
  } catch (error: any) {
    console.error('Update Asset API error:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const deletedAsset = await Asset.findOneAndDelete({ _id: id, userId: authUser.userId });

    if (!deletedAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    console.error('Delete Asset API error:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
