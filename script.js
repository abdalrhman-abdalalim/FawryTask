
function ShippingService() {
  this.shipItems = function (shippableItems) {
    console.log("** Shipping Service Notification **");
    let totalWeight = 0;

    shippableItems.forEach((item) => {
      console.log(`${item.getName()} - ${item.getWeight()}g`);
      totalWeight += item.getWeight();
    });

    console.log(`Total package weight: ${(totalWeight / 1000).toFixed(2)}kg`);
  };
}

function Product(id, name, price, stock, expires, needsShip, weight) {
  this.id = id;
  this.name = name;
  this.price = price;
  this.stock = stock;
  this.expires = expires;
  this.needsShip = needsShip;
  this.weight = weight;
}

function CartItem(product, quantity) {
  this.product = product;
  this.quantity = quantity;
}


function User(name, balance) {
  this.name = name;
  this.balance = balance;

  this.deductBalance = function (amount) {
    if (amount > this.balance) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  };
}

// Main Store class
function Store() {
  this.products = [
    new Product(
      "p1",
      "Cheese",
      100,
      10,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
      true,
      700
    ),
    new Product(
      "p2",
      "Biscuits",
      50,
      15,
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      true,
      500
    ),
    new Product("p3", "TV", 10000, 5, null, true, 15000),
    new Product("p4", "Mobile", 500, 20, null, false, null),
  ];

  this.cart = [];
  this.shippingRate = 30; 
  this.shippingService = new ShippingService();
  this.currentUser = new User("Customer", 5000); 
}

Store.prototype.showProducts = function () {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  this.products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const isExpired = product.expires && new Date() > product.expires;
    const maxQty = product.stock > 0 ? product.stock : 0;

    card.innerHTML = `
          <h3>${product.name}${
      isExpired ? ' <span class="expired">(Expired)</span>' : ""
    }</h3>
          <p>Price: $${product.price.toFixed(2)}</p>
          <p>Available: ${product.stock}</p>
          ${product.needsShip ? `<p>Weight: ${product.weight}g</p>` : ""}
          <div class="qty-control">
              <input type="number" id="qty-${product.id}" 
                     min="1" max="${maxQty}" value="1" ${
      maxQty === 0 ? "disabled" : ""
    }>
              <button onclick="store.addToCart('${product.id}')" 
                      ${isExpired || maxQty === 0 ? "disabled" : ""}>
                  ${
                    isExpired
                      ? "Expired"
                      : maxQty === 0
                      ? "Out of stock"
                      : "Add to cart"
                  }
              </button>
          </div>
      `;

    grid.appendChild(card);
  });

  const balanceEl = document.getElementById("userBalance");
  if (balanceEl) {
    balanceEl.textContent = `Balance: $${this.currentUser.balance.toFixed(2)}`;
  }
};

Store.prototype.addToCart = function (productId) {
  const product = this.products.find((p) => p.id === productId);
  if (!product) return;

  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = parseInt(qtyInput.value);

  if (isNaN(qty) || qty < 1 || qty > product.stock) {
    alert(`Invalid quantity. Maximum available: ${product.stock}`);
    return;
  }

  product.stock -= qty;

  const existingItem = this.cart.find((item) => item.product.id === productId);
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    this.cart.push(new CartItem(product, qty));
  }

  this.updateCartDisplay();
  this.showProducts();
};

Store.prototype.removeFromCart = function (productId) {
  const itemIndex = this.cart.findIndex(
    (item) => item.product.id === productId
  );
  if (itemIndex === -1) return;

  const item = this.cart[itemIndex];

  item.product.stock += item.quantity;

  this.cart.splice(itemIndex, 1);

  this.updateCartDisplay();
  this.showProducts();
};

Store.prototype.updateCartDisplay = function () {
  const cartEl = document.getElementById("cartItems");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!cartEl) return;

  if (this.cart.length === 0) {
    cartEl.innerHTML = "<p>Your cart is empty</p>";
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  let html = '<ul class="cart-items">';
  let subtotal = 0;

  this.cart.forEach((item) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;

    html += `
          <li>
              <span>${item.quantity} × ${item.product.name}</span>
              <span>$${itemTotal.toFixed(2)}</span>
              <button onclick="store.removeFromCart('${item.product.id}')">
                  Remove
              </button>
          </li>
      `;
  });

  html += "</ul>";

  const shippingCost = this.calculateShipping();
  const total = subtotal + shippingCost;

  html += `
      <div class="cart-summary">
          <div>Subtotal: $${subtotal.toFixed(2)}</div>
          <div>Shipping: $${shippingCost.toFixed(2)}</div>
          <div class="total">Total: $${total.toFixed(2)}</div>
      </div>
  `;

  cartEl.innerHTML = html;
  if (checkoutBtn) checkoutBtn.style.display = "block";
};

Store.prototype.calculateShipping = function () {
  let totalWeight = 0;

  this.cart.forEach((item) => {
    if (item.product.needsShip) {
      totalWeight += item.product.weight * item.quantity;
    }
  });

  return (totalWeight / 1000) * this.shippingRate;
};


Store.prototype.checkout = function () {
  if (this.cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const expiredItem = this.cart.find(
    (item) => item.product.expires && new Date() > item.product.expires
  );

  if (expiredItem) {
    alert(`Cannot checkout: ${expiredItem.product.name} is expired`);
    return;
  }

  const outOfStockItem = this.cart.find(
    (item) => item.product.stock < 0
  );
  if (outOfStockItem) {
    alert(`Cannot checkout: ${outOfStockItem.product.name} is out of stock`);
    return;
  }


  const subtotal = this.cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shippingCost = this.calculateShipping();
  const total = subtotal + shippingCost;

  try {
    this.currentUser.deductBalance(total);
  } catch (e) {
    alert("Insufficient funds to complete purchase");
    return;
  }

  const shippableItems = this.cart
    .filter((item) => item.product.needsShip)
    .flatMap((item) =>
      Array(item.quantity).fill({
        getName: () => item.product.name,
        getWeight: () => item.product.weight,
      })
    );

  if (shippableItems.length > 0) {
    this.shippingService.shipItems(shippableItems);
  }

  this.showReceipt(subtotal, shippingCost, total);

  this.cart = [];
  this.updateCartDisplay();
  this.showProducts();
};

Store.prototype.showReceipt = function (subtotal, shipping, total) {
  const receiptEl = document.getElementById("receipt");
  const contentEl = document.getElementById("receiptContent");

  if (!receiptEl || !contentEl) return;

  let html = "<h3>Order Confirmation</h3>";
  html += '<div class="receipt-items">';

  this.cart.forEach((item) => {
    html += `
          <div class="receipt-item">
              <span>${item.quantity} × ${item.product.name}</span>
              <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
      `;
  });

  html += "</div>";
  html += `
      <div class="order-summary">
          <div><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
          <div><span>Shipping:</span><span>$${shipping.toFixed(2)}</span></div>
          <div class="total"><span>Total:</span><span>$${total.toFixed(
            2
          )}</span></div>
          <div><span>Remaining Balance:</span><span>$${this.currentUser.balance.toFixed(
            2
          )}</span></div>
      </div>
      <p class="thank-you">Thank you for your purchase!</p>
  `;

  contentEl.innerHTML = html;
  receiptEl.style.display = "block";
};

const store = new Store();

document.addEventListener("DOMContentLoaded", function () {
  store.showProducts();

  document.getElementById("checkoutBtn").addEventListener("click", function () {
    store.checkout();
  });
});
