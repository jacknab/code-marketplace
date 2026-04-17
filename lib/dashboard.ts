import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase";

export interface Activity {
  id: string;
  type: "sale" | "message" | "system";
  developerId: string;
  listingId?: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  createdAt: any;
}

export interface Comment {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  message: string;
  parentId?: string;
  createdAt: any;
}

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  developerId: string;
  buyerId: string;
  buyerEmail: string;
  price: number;
  licenseType: "basic" | "extended";
  createdAt: any;
}

export interface DailySale {
  date: string;
  amount: number;
  sales: number;
}

export interface Transaction {
  id: string;
  date: any;
  orderId?: string;
  type: "Sale" | "Fee" | "Payout" | "Refund";
  detail: string;
  price: number;
  amount: number;
}

export interface StatementSummary {
  myFunds: number;
  earnings: number;
  taxWithheld: number;
  fees: number;
}

export interface DashboardMetrics {
  thisMonthRevenue: number;
  thisMonthSalesCount: number;
  lifetimeEarnings: number;
  pendingBalance: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  dailySales: DailySale[];
}

export async function getDashboardMetrics(developerId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);

  try {
    // Fetch all orders for this developer
    const ordersQuery = query(
      collection(db, "orders"),
      where("developerId", "==", developerId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    // Calculate metrics
    let lifetimeEarnings = 0;
    let thisMonthRevenue = 0;
    let thisMonthSalesCount = 0;
    const dailyMap: { [key: string]: { amount: number; sales: number } } = {};

    // Initialize daily map for the current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
       const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
       dailyMap[dateStr] = { amount: 0, sales: 0 };
    }

    orders.forEach(order => {
      const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt);
      lifetimeEarnings += order.price;
      
      if (orderDate >= firstDayOfMonth) {
        thisMonthRevenue += order.price;
        thisMonthSalesCount += 1;
        
        const dateKey = orderDate.toISOString().split('T')[0];
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].amount += order.price;
          dailyMap[dateKey].sales += 1;
        }
      }
    });

    const dailySales: DailySale[] = Object.entries(dailyMap).map(([date, data]) => ({
      date: date.split('-')[2], // Just the day number
      amount: data.amount,
      sales: data.sales
    })).sort((a, b) => parseInt(a.date) - parseInt(b.date));

    // Fetch listing stats
    const listingsQuery = query(
      collection(db, "listings"),
      where("authorId", "==", developerId)
    );
    const listingsSnapshot = await getDocs(listingsQuery);
    const listings = listingsSnapshot.docs.map(doc => doc.data());

    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === "Approved").length;
    const pendingListings = listings.filter(l => l.status === "Pending").length;

    return {
      thisMonthRevenue,
      thisMonthSalesCount,
      lifetimeEarnings,
      pendingBalance: lifetimeEarnings * 0.8, // Example calculation (80% payout)
      totalListings,
      activeListings,
      pendingListings,
      dailySales
    };
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return {
      thisMonthRevenue: 0,
      thisMonthSalesCount: 0,
      lifetimeEarnings: 0,
      pendingBalance: 0,
      totalListings: 0,
      activeListings: 0,
      pendingListings: 0,
      dailySales: []
    };
  }
}

export async function getActivity(developerId: string, typeFilter: string = "all"): Promise<Activity[]> {
  try {
    let q = query(
      collection(db, "activity"),
      where("developerId", "==", developerId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    if (typeFilter !== "all") {
      q = query(q, where("type", "==", typeFilter));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
  } catch (error) {
    console.error("Activity fetch error:", error);
    return [];
  }
}

export async function markActivityRead(activityId: string) {
  const activityRef = doc(db, "activity", activityId);
  await updateDoc(activityRef, { isRead: true });
}

export async function postCommentReply(parentId: string, listingId: string, userId: string, userName: string, message: string) {
  const commentData = {
    listingId,
    userId,
    userName,
    message,
    parentId,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, "comments"), commentData);
  return docRef.id;
}

export async function getTransactions(developerId: string): Promise<Transaction[]> {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("developerId", "==", developerId),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(ordersQuery);
    const transactions: Transaction[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data() as Order;
      // For each order, we have a Sale and a Fee (simulating CodeCanyon)
      const saleAmount = data.price;
      const feeAmount = data.price * 0.2; // 20% commission
      const netAmount = saleAmount - feeAmount;

      transactions.push({
        id: `${doc.id}-sale`,
        date: data.createdAt,
        orderId: doc.id,
        type: "Sale",
        detail: `Sale of ${data.listingTitle}`,
        price: saleAmount,
        amount: saleAmount
      });

      transactions.push({
        id: `${doc.id}-fee`,
        date: data.createdAt,
        orderId: doc.id,
        type: "Fee",
        detail: `Author Fee for ${data.listingTitle}`,
        price: feeAmount,
        amount: -feeAmount
      });
    });

    return transactions.sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
      const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return [];
  }
}

export async function getStatementSummary(developerId: string): Promise<StatementSummary> {
  const metrics = await getDashboardMetrics(developerId);
  return {
    myFunds: metrics.lifetimeEarnings * 0.8, // Net funds available
    earnings: metrics.thisMonthRevenue,
    taxWithheld: 0,
    fees: metrics.thisMonthRevenue * 0.2
  };
}
