 "use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Heart, Menu, X, Minus, Plus, ArrowRight, Moon, Sun } from "lucide-react";
import { products, Product } from "../data/products";
import { loadProducts, PRODUCTS_UPDATED_EVENT } from "../data/productStore";
import { addOrder, hydrateOrders, OrderItem } from "../data/orderStore";

type CartItem = Product & { quantity: number; variant: string };

export default function HomePage() {
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [checkout, setCheckout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("gbp-cart");
    if (raw) setCart(JSON.parse(raw));
    setDarkMode(localStorage.getItem("gbp-theme") === "dark");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("darkMode", darkMode);
    localStorage.setItem("gbp-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    setCatalog(loadProducts());
    hydrateOrders();
    const handleProductsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Product[]>).detail;
      if (detail) setCatalog(detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "gbp-products") setCatalog(loadProducts());
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("gbp-cart", JSON.stringify(cart));
  }, [cart]);

  const categories = ["All", ...Array.from(new Set(catalog.map(p => p.category)))];

  const filtered = useMemo(() => catalog.filter(p => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesQuery = `${p.name} ${p.category} ${p.sku}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [catalog, category, query]);

  const addToCart = (product: Product, variant = product.variants?.[0] || "Standard") => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id && i.variant === variant);
      if (found) return prev.map(i => i === found ? {...i, quantity: Math.min(i.quantity + 1, product.stock)} : i);
      return [...prev, {...product, quantity: 1, variant}];
    });
    setCartOpen(true);
  };

  const changeQty = (id: string, variant: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id && i.variant === variant
      ? {...i, quantity: Math.max(1, Math.min(i.stock, i.quantity + delta))}
      : i
    ));
  };

  const removeItem = (id: string, variant: string) => setCart(prev => prev.filter(i => !(i.id === id && i.variant === variant)));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const submitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = `GBP-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${String(Math.floor(Math.random()*900)+100)}`;
    const formData = new FormData(e.currentTarget);
    const orderItems: OrderItem[] = cart.map(item => ({ id: item.id, name: item.name, image: item.image, price: item.price, quantity: item.quantity, variant: item.variant }));
    addOrder({
      id,
      createdAt: new Date().toISOString(),
      customer: {
        firstName: String(formData.get("firstName") || ""), lastName: String(formData.get("lastName") || ""),
        email: String(formData.get("email") || ""), mobile: String(formData.get("mobile") || ""),
        address: String(formData.get("address") || ""), barangay: String(formData.get("barangay") || ""),
        city: String(formData.get("city") || ""), province: String(formData.get("province") || ""), postal: String(formData.get("postal") || "")
      },
      payment: String(formData.get("payment") || ""), reference: String(formData.get("reference") || ""),
      notes: String(formData.get("notes") || ""), items: orderItems, total, status: "Order Received"
    });
    setOrderId(id);
    setCart([]);
    setCheckout(false);
  };

  return (
    <>
      <header className="siteHeader">
        <div className="container nav">
          <a href="#" className="logo"><img src="/gbp-logo.png" alt="GBP Home Art & Decors"/><span>GBP HOME ART & DECORS</span></a>
          <nav className="navLinks">
            <a href="#home">Home</a><a href="#collections">Collections</a><a href="#shop">Shop</a><a href="#about">About</a><a href="#delivery">Delivery</a><a href="/shipment">Track order</a>
          </nav>
          <div className="navActions">
            <button className="iconBtn" onClick={() => document.getElementById("search")?.focus()} aria-label="Search"><Search size={17}/></button>
            <button className="iconBtn" aria-label="Wishlist"><Heart size={17}/></button>
            <button className="iconBtn" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to night mode"}>{darkMode ? <Sun size={17}/> : <Moon size={17}/>}</button>
            <button className="iconBtn" onClick={() => setCartOpen(true)} aria-label="Shopping bag"><ShoppingBag size={17}/>{cart.length > 0 && <span className="badge">{cart.length}</span>}</button>
            <button className="iconBtn menuBtn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X size={18}/> : <Menu size={18}/>}</button>
          </div>
        </div>
        {menuOpen && <div className="container" style={{padding:"18px 0", borderTop:"1px solid var(--line)"}}><nav style={{display:"grid",gap:12}}>{["Home","Collections","Shop","About","Delivery","Contact"].map(x=><a key={x} href={"#"+x.toLowerCase()} onClick={()=>setMenuOpen(false)}>{x}</a>)}</nav></div>}
      </header>

      <main>
        <section className="hero reveal" id="home">
          <div className="container heroInner">
            <div className="kicker">GBP Home Art & Decors</div>
            <h1 className="serif">Elevate Your Space.<br/>Define Your Style.</h1>
            <p>Discover thoughtfully curated home décor pieces designed to bring warmth, character, and timeless elegance into every space.</p>
            <div className="actions"><a href="#shop" className="btn btnGold">Explore Collections</a><a href="#featured" className="btn btnLight">Shop Featured Pieces</a></div>
          </div>
        </section>

        <section className="section reveal" id="collections">
          <div className="container">
            <div className="sectionHead"><div><div className="kicker">Curated for your space</div><h2 className="serif">Collections</h2></div><p>From sculptural statements to subtle accents, discover pieces selected to create beautiful moments at home.</p></div>
            <div className="collections">
              <div className="collection reveal reveal-delay-1" style={{backgroundImage:"url(https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=85)"}}><div className="kicker">01</div><h3>The Statement Collection</h3><p>Bold pieces for spaces that deserve attention.</p></div>
              <div className="collection reveal reveal-delay-2" style={{backgroundImage:"url(https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85)"}}><div className="kicker">02</div><h3>The Golden Collection</h3><p>Refined accents inspired by timeless luxury.</p></div>
              <div className="collection reveal reveal-delay-3" style={{backgroundImage:"url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85)"}}><div className="kicker">03</div><h3>The Modern Minimalist</h3><p>Clean forms. Quiet elegance.</p></div>
            </div>
          </div>
        </section>

        <section className="section reveal" id="shop" style={{background:"var(--cream)"}}>
          <div className="container">
            <div className="sectionHead" id="featured"><div><div className="kicker">Shop GBP</div><h2 className="serif">Featured Pieces</h2></div><div style={{display:"flex",gap:8}}><input id="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." style={{padding:"11px 13px",border:"1px solid var(--line)",background:"white",minWidth:210}} /></div></div>
            <div className="filters">{categories.map(c=><button key={c} className={`filter ${category===c?"active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
            <div className="productGrid">
              {filtered.map((p, index) => <article className={`product reveal reveal-delay-${(index % 3) + 1}`} key={p.id}>
                <div className="productImg"><img src={p.image} alt={p.name}/></div>
                <div className="productInfo"><div className="productCat">{p.category}</div><div className="productName">{p.name}</div><div className="price">₱{p.price.toLocaleString()}</div><div className={`catalogStock ${p.stock === 0 ? "empty" : p.stock <= 5 ? "low" : "available"}`}>{p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</div><div className="productActions"><button className="btn btnDark" onClick={()=>addToCart(p)} disabled={p.stock === 0}>{p.stock === 0 ? "Out of Stock" : "Add to Cart"}</button><button className="btn btnOutline" onClick={()=>setSelected(p)}>Details</button></div></div>
              </article>)}
            </div>
          </div>
        </section>

        <section className="section editorial reveal" id="about">
          <div className="container editorialGrid"><div><div className="kicker">The GBP philosophy</div><h2>Objects With Character.<br/>Spaces With Meaning.</h2><p>GBP Home Art & Decors brings together decorative pieces designed to add warmth, personality, and a sophisticated finishing touch to modern interiors. Every item is presented as part of the space—not simply as a product.</p><a href="#contact" className="btn btnGold">Discover GBP</a></div><div className="editorialImg"/></div>
        </section>

        <section className="section reveal">
          <div className="container">
            <div className="sectionHead"><div><div className="kicker">Why GBP</div><h2 className="serif">Designed to feel special.</h2></div></div>
            <div className="whyGrid">
              <div className="why"><strong>Curated Elegance</strong><span className="muted">Thoughtfully selected pieces that elevate everyday spaces.</span></div>
              <div className="why"><strong>Quality Craftsmanship</strong><span className="muted">Decor designed with attention to form, detail, and finish.</span></div>
              <div className="why"><strong>Reliable Service</strong><span className="muted">From inquiry to delivery, we make each order simple and personal.</span></div>
              <div className="why"><strong>Nationwide Delivery</strong><span className="muted">Flexible delivery and shipping options across the Philippines.</span></div>
            </div>
          </div>
        </section>

        <section className="section reveal" id="delivery" style={{background:"var(--cream)"}}>
          <div className="container">
            <div className="sectionHead"><div><div className="kicker">Delivery</div><h2 className="serif">Beautiful pieces, delivered.</h2></div><p>Offer same-day and standard shipping based on product size, location, availability, and courier service.</p></div>
            <div className="whyGrid"><div className="why"><strong>Same-Day</strong><span className="muted">Lalamove, Grab, JoyRide, subject to location and availability.</span></div><div className="why"><strong>Nationwide</strong><span className="muted">J&T Express, LBC, and other preferred courier options.</span></div><div className="why"><strong>Careful Fulfillment</strong><span className="muted">Orders are reviewed and prepared before shipment.</span></div><div className="why"><strong>Order Updates</strong><span className="muted">Track the order journey from received to delivered.</span></div></div>
          </div>
        </section>

        <section className="section reveal">
          <div className="container">
            <div className="sectionHead"><div><div className="kicker">Customer notes</div><h2 className="serif">Loved in real spaces.</h2></div></div>
            <div className="testimonials"><div className="quote"><p>“Beautiful piece. It completely transformed our living room and feels even better in person.”</p><strong>— GBP Customer</strong></div><div className="quote"><p>“Elegant, carefully packed, and exactly what we wanted for our home.”</p><strong>— GBP Customer</strong></div><div className="quote"><p>“The inquiry process made it easy to ask about the item before ordering.”</p><strong>— GBP Customer</strong></div></div>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="container">
          <div className="footerGrid">
            <div><div className="logo" style={{color:"white"}}><img src="/gbp-logo.png" alt="GBP Home Art & Decors"/><span>GBP HOME ART & DECORS</span></div><p>Luxury • Elegant • Premium</p></div>
            <div><h4>Explore</h4><a href="#home">Home</a><br/><a href="#collections">Collections</a><br/><a href="#shop">Shop</a><br/><a href="#about">About</a></div>
            <div><h4>Support</h4><a href="#delivery">Delivery</a><br/><a href="#contact">Contact</a><br/><a href="/shipment">Track Shipment</a><br/><a href="/admin">Admin Dashboard</a><br/><a href="/admin/inventory">Inventory Studio</a></div>
            <div><h4>Inquiries</h4><p>For product availability, dimensions, delivery, or special requests, use the “Inquire About This Item” action on a product.</p></div>
          </div>
          <div className="footerBottom">© {new Date().getFullYear()} GBP Home Art & Decors. All rights reserved.</div>
        </div>
      </footer>

      {cartOpen && <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setCartOpen(false)}><aside className="drawer"><div className="drawerHead"><h2 className="serif">Your Collection</h2><button className="iconBtn" onClick={()=>setCartOpen(false)}><X size={18}/></button></div>{cart.length===0?<p className="muted">Your collection is empty.</p>:cart.map(i=><div className="cartItem" key={i.id+i.variant}><img src={i.image} alt=""/><div><strong>{i.name}</strong><div className="muted" style={{fontSize:12}}>{i.variant}</div><div className="qty"><button onClick={()=>changeQty(i.id,i.variant,-1)}><Minus size={12}/></button><span>{i.quantity}</span><button onClick={()=>changeQty(i.id,i.variant,1)}><Plus size={12}/></button></div></div><div><strong>₱{(i.price*i.quantity).toLocaleString()}</strong><button onClick={()=>removeItem(i.id,i.variant)} style={{display:"block",border:0,background:"none",color:"#999",fontSize:11,marginTop:8}}>Remove</button></div></div>)}{cart.length>0&&<><div className="total"><span>Total</span><span>₱{total.toLocaleString()}</span></div><button className="btn btnDark" style={{width:"100%"}} onClick={()=>{setCheckout(true);setCartOpen(false)}}>Proceed to Checkout <ArrowRight size={14}/></button></>}</aside></div>}

      {selected && <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="modal"><div className="drawerHead"><h2 className="serif">Product Details</h2><button className="iconBtn" onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="modalGrid"><img className="modalImg" src={selected.image} alt={selected.name}/><div><div className="productCat">{selected.category}</div><h2 className="serif" style={{fontSize:32}}>{selected.name}</h2><div className="price" style={{fontSize:22}}>₱{selected.price.toLocaleString()}</div><p className="muted" style={{lineHeight:1.7}}>{selected.description}</p><div className="notice">SKU: {selected.sku}<br/>Dimensions: {selected.dimensions}<br/>Availability: {selected.stock > 0 ? `${selected.stock} in stock` : "Out of stock"}</div>{selected.variants && <div style={{marginTop:18}}><label className="field"><span className="muted">Variant</span><select id="variantSelect">{selected.variants.map(v=><option key={v}>{v}</option>)}</select></label></div>}<div className="actions"><button className="btn btnDark" onClick={()=>{const v=(document.getElementById("variantSelect") as HTMLSelectElement)?.value; addToCart(selected,v);setSelected(null)}} disabled={selected.stock===0}>Add to Cart</button><button className="btn btnOutline" onClick={()=>{setSelected(null);alert("Inquiry form: connect this action to your email/database service.")}}>Inquire About This Item</button></div></div></div></div></div>}

      {checkout && <div className="overlay"><div className="modal"><div className="drawerHead"><h2 className="serif">Complete Your Order</h2><button className="iconBtn" onClick={()=>setCheckout(false)}><X size={18}/></button></div><div className="notice" style={{marginBottom:20}}>Demo checkout is functional on the frontend. Connect the submit action to Supabase/PostgreSQL and an email service for production order processing.</div><form onSubmit={submitOrder}><div className="formGrid"><div className="field"><label>First Name</label><input required name="firstName"/></div><div className="field"><label>Last Name</label><input required name="lastName"/></div><div className="field"><label>Email Address</label><input required type="email" name="email"/></div><div className="field"><label>Mobile Number</label><input required name="mobile"/></div><div className="field full"><label>Complete Delivery Address</label><textarea required name="address"/></div><div className="field"><label>Barangay</label><input required name="barangay"/></div><div className="field"><label>City / Municipality</label><input required name="city"/></div><div className="field"><label>Province</label><input required name="province"/></div><div className="field"><label>Postal Code</label><input required name="postal"/></div><div className="field"><label>Payment Method</label><select required name="payment"><option>GCash</option><option>Bank Transfer</option><option>Cash on Delivery</option></select></div><div className="field"><label>Payment Reference</label><input name="reference" placeholder="If applicable"/></div><div className="field full"><label>Order Notes</label><textarea name="notes" placeholder="Optional delivery or product notes"/></div><div className="field full"><label style={{display:"flex",gap:8,alignItems:"center",textTransform:"none",letterSpacing:0}}><input required type="checkbox"/> I confirm that my information and order details are correct.</label></div></div><div className="total"><span>Order Total</span><span>₱{total.toLocaleString()}</span></div><button className="btn btnDark" style={{width:"100%"}}>Confirm Order</button></form></div></div>}

      {orderId && <div className="overlay"><div className="modal" style={{textAlign:"center"}}><div className="kicker">Order received</div><h2 className="serif" style={{fontSize:46}}>Thank you.</h2><p className="muted">Your GBP order has been created and is ready for business-side processing.</p><div className="notice"><strong>Order ID: {orderId}</strong><br/>Status: Order Received</div><div className="actions" style={{justifyContent:"center"}}><button className="btn btnDark" onClick={()=>setOrderId("")}>Continue Shopping</button></div></div></div>}
    </>
  );
}