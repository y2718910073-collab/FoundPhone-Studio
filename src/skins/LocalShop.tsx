import { useSkinState } from "../skinState";
import type { Item } from "../schema";
import type { Props } from "./shared";
import "./shop-interactions.css";

export type LocalOrder = { id: string; title: string; price: number; quantity: number; status: "已下单" | "已发货" | "已送达"; createdAt: string };
export function numericPrice(item: Item): number {
  const v = Number(String(item.meta?.price ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) && v >= 0 ? Math.min(v, 100000) : 0;
}
export function useLocalShop(p: Props, key: string) {
  const [cart, setCart] = useSkinState<Record<string, number>>(p, key + "-cart", {});
  const [orders, setOrders] = useSkinState<LocalOrder[]>(p, key + "-orders", []);
  const [address, setAddress] = useSkinState<string>(p, key + "-address", "拾光书屋（虚构地址）");
  const add = (item: Item) => setCart({ ...cart, [item.id]: Math.min(99, (cart[item.id] || 0) + 1) });
  const remove = (item: Item) => {
    const next = { ...cart };
    if ((next[item.id] || 0) <= 1) delete next[item.id];
    else next[item.id] -= 1;
    setCart(next);
  };
  const checkout = (items: Item[]) => {
    const selected = items.filter(x => cart[x.id] > 0);
    if (!selected.length || !address.trim()) return false;
    const now = new Date().toISOString();
    const made: LocalOrder[] = selected.map((item, index) => ({
      id: `SIM-${Date.now()}-${index}`,
      title: item.title,
      price: numericPrice(item),
      quantity: cart[item.id],
      status: "已下单",
      createdAt: now,
    }));
    setOrders([...made, ...orders].slice(0, 100));
    setCart({});
    return true;
  };
  const advance = (id: string) => setOrders(orders.map(o => o.id === id ? ({
    ...o, status: o.status === "已下单" ? "已发货" : "已送达",
  }) : o));
  return { cart, orders, address, setAddress, add, remove, checkout, advance };
}
export function CartPanel({ p, shop, items, title = "购物车" }: {
  p: Props; shop: ReturnType<typeof useLocalShop>; items: Item[]; title?: string;
}) {
  const selected = items.filter(i => shop.cart[i.id] > 0);
  const total = selected.reduce((sum, i) => sum + numericPrice(i) * shop.cart[i.id], 0);
  return (
    <section className="local-shop-cart" aria-label={title}>
      <h3>{title} · {selected.reduce((n, i) => n + shop.cart[i.id], 0)} 件</h3>
      {selected.map(i => <div className="local-shop-line" key={i.id}>
        <span>{i.title} · ¥{numericPrice(i).toFixed(2)}</span>
        <button aria-label={`减少${i.title}`} onClick={() => shop.remove(i)}>−</button>
        <b>{shop.cart[i.id]}</b>
        <button aria-label={`增加${i.title}`} onClick={() => shop.add(i)}>+</button>
      </div>)}
      <label>模拟收货地址<input aria-label="模拟收货地址" value={shop.address} onChange={e => shop.setAddress(e.target.value)} maxLength={100}/></label>
      <footer><b>合计 ¥{total.toFixed(2)}</b><button disabled={!selected.length || !shop.address.trim()} onClick={() => shop.checkout(items)}>模拟下单</button></footer>
      <small>仅为虚构手机游戏订单，不会扣款、配送或向商家发送数据。</small>
    </section>
  );
}
export function OrderPanel({ shop }: { shop: ReturnType<typeof useLocalShop> }) {
  return <section className="local-shop-cart" aria-label="我的模拟订单">
    <h3>我的模拟订单 · {shop.orders.length}</h3>
    {shop.orders.map(o => <div key={o.id} className="local-shop-order">
      <strong>{o.title} × {o.quantity}</strong>
      <span>¥{(o.price * o.quantity).toFixed(2)} · {o.status}</span>
      <small>{o.createdAt.slice(0, 16).replace("T", " ")}</small>
      {o.status !== "已送达" && <button onClick={() => shop.advance(o.id)}>推进模拟物流</button>}
    </div>)}
    {!shop.orders.length && <p>还没有模拟订单，先添加商品到购物车。</p>}
  </section>;
}
