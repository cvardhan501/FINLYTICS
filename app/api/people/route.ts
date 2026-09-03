import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Person } from '@/models/Person';
import { Loan } from '@/models/Loan';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();

    if (db) {
      const dbPeople = await Person.find({ userId: authUser.userId }).lean();
      const loans = await Loan.find({ userId: authUser.userId }).lean();

      // Aggregate debt per person
      const peopleMap: Record<string, any> = {};

      dbPeople.forEach((p: any) => {
        peopleMap[p.name.toLowerCase()] = {
          id: p._id.toString(),
          name: p.name,
          phone: p.phone,
          gave: 0,
          received: 0,
          remainingGave: 0,
          borrowed: 0,
          paid: 0,
          remainingBorrowed: 0,
          netBalance: 0,
          isSettled: true,
        };
      });

      loans.forEach((l: any) => {
        const key = l.personName.toLowerCase();
        if (!peopleMap[key]) {
          peopleMap[key] = {
            id: 'p_' + key,
            name: l.personName,
            gave: 0,
            received: 0,
            remainingGave: 0,
            borrowed: 0,
            paid: 0,
            remainingBorrowed: 0,
            netBalance: 0,
            isSettled: true,
          };
        }

        const item = peopleMap[key];
        if (l.type === 'given') {
          item.gave += l.principal;
          item.received += l.paidAmount || 0;
          item.remainingGave += Math.max(0, l.principal - (l.paidAmount || 0));
        } else {
          item.borrowed += l.principal;
          item.paid += l.paidAmount || 0;
          item.remainingBorrowed += Math.max(0, l.principal - (l.paidAmount || 0));
        }
        item.netBalance = item.remainingGave - item.remainingBorrowed;
        item.isSettled = item.remainingGave === 0 && item.remainingBorrowed === 0;
      });

      const list = Object.values(peopleMap);
      return NextResponse.json({ people: list });
    }

    return NextResponse.json({ people: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch people relationships' }, { status: 500 });
  }
}
