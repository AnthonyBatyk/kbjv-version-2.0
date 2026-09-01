document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================================
     SUPABASE
  ========================================================= */

  const SUPABASE_URL = "https://hbyeycsoxedzvapesrwq.supabase.co";
  const SUPABASE_KEY =
    "sb_publishable_uSR9bn7YeGiy-PTKlUTBNw_ZQtL5Icn";

  let supabaseClient = null;

  try {
    if (
      window.supabase &&
      typeof window.supabase.createClient === "function"
    ) {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    }
  } catch (error) {
    console.error("Supabase initialization error:", error);
  }


  /* =========================================================
     BUTTON STATUS STYLES
  ========================================================= */

  const statusStyle = document.createElement("style");

  statusStyle.textContent = `
    /* =====================================================
       ACTION BUTTON STATUS
    ===================================================== */

    .button-status-success {
      background: #22c55e !important;
      background-color: #22c55e !important;
      border-color: #22c55e !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(34, 197, 94, 0.35),
        0 0 18px rgba(34, 197, 94, 0.35) !important;
    }

    .button-status-error {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(239, 68, 68, 0.35),
        0 0 18px rgba(239, 68, 68, 0.35) !important;
    }

    .button-status-info {
      background: #3b82f6 !important;
      background-color: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: #ffffff !important;
      box-shadow:
        0 0 0 1px rgba(59, 130, 246, 0.35),
        0 0 18px rgba(59, 130, 246, 0.35) !important;
    }

    .button-status-success,
    .button-status-error,
    .button-status-info {
      transition:
        background 0.2s ease,
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        color 0.2s ease,
        transform 0.15s ease;
    }

    .button-status-success::after,
    .button-status-error::after {
      display: inline-block;
      margin-left: 7px;
      font-weight: 800;
      font-size: 15px;
      line-height: 1;
    }

    .button-status-success::after {
      content: "✓";
    }

    .button-status-error::after {
      content: "✕";
    }

    .button-status-info::after {
      content: "";
    }

    .button-status-success.button-status-pulse,
    .button-status-error.button-status-pulse {
      animation: kbjvButtonPulse 0.35s ease;
    }

    @keyframes kbjvButtonPulse {
      0% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.025);
      }

      100% {
        transform: scale(1);
      }
    }

    /* =====================================================
       DELETE PRODUCT BUTTONS
    ===================================================== */

    .delete-product-item-button {
      background: #ef4444 !important;
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
    }

    .delete-product-item-button:hover {
      background: #dc2626 !important;
      background-color: #dc2626 !important;
      border-color: #dc2626 !important;
    }
  `;

  document.head.appendChild(statusStyle);


  /* =========================================================
     LOCAL STORAGE KEYS
  ========================================================= */

  const PRODUCTS_KEY = "kbjv_products";
  const CALCULATOR_KEY = "kbjv_calculator";
  const ARCHIVE_KEY = "kbjv_archive";


  /* =========================================================
     DEFAULT PRODUCTS
  ========================================================= */

  const DEFAULT_PRODUCTS = [
    {
      id: "local-eggs",
      name: "Яйця",
      kcal: 155,
      protein: 12,
      fat: 10.2,
      carb: 0.8,
      unit: "г",
      full_name: "Яйця aro курячі харчові столові L C0"
    },

    {
      id: "local-heineken",
      name: "Пиво Heineken",
      kcal: 42,
      protein: 0,
      fat: 0,
      carb: 3.2,
      unit: "мл",
      full_name:
        "Пиво Heineken світле нефільтроване пастеризоване, напій алкогольний, вміст спирту 5%"
    }
  ];


  /* =========================================================
     GLOBAL STATE
  ========================================================= */

  let products = [];
  let calculatorItems = [];
  let archiveItems = [];

  let selectedProduct = null;
  let draggedCard = null;

  let reorderMode = false;
  let reorderChanged = false;

  let archiveEditingId = null;

  /* Для перевірки реальних змін в архіві */
  let archiveOriginalDate = null;
  let archiveOriginalText = null;


  /* =========================================================
     DOM
  ========================================================= */

  const tabs = document.querySelectorAll(".tab");
  const pages = document.querySelectorAll(".page");

  const grid = document.getElementById("grid");

  const searchInput = document.getElementById("search");
  const clearSearch = document.getElementById("clear-search");

  const exportButton = document.getElementById("export-products");
  const importButton = document.getElementById("import-products");
  const importFile = document.getElementById("import-file");

  const addProductButton = document.getElementById("add-product");
  const deleteProductButton = document.getElementById("delete-product");
  const reorderProductsButton =
    document.getElementById("reorder-products");

  const reorderHint = document.getElementById("reorder-hint");

  const productModal = document.getElementById("product-modal");
  const productModalName =
    document.getElementById("product-modal-name");
  const productWeight =
    document.getElementById("product-weight");

  const productCancel =
    document.getElementById("product-cancel");
  const productCopy =
    document.getElementById("product-copy");
  const productCalculator =
    document.getElementById("product-calculator");

  const addProductModal =
    document.getElementById("add-product-modal");

  const addProductCancel =
    document.getElementById("add-product-cancel");

  const addProductSave =
    document.getElementById("add-product-save");

  const newProductName =
    document.getElementById("new-product-name");

  const newProductKcal =
    document.getElementById("new-product-kcal");

  const newProductProtein =
    document.getElementById("new-product-protein");

  const newProductFat =
    document.getElementById("new-product-fat");

  const newProductCarb =
    document.getElementById("new-product-carb");

  const newProductDescription =
    document.getElementById("new-product-description");

  const deleteProductModal =
    document.getElementById("delete-product-modal");

  const deleteProductList =
    document.getElementById("delete-product-list");

  const deleteProductCancel =
    document.getElementById("delete-product-cancel");

  const calcInput =
    document.getElementById("calc-input");

  const calcAdd =
    document.getElementById("calc-add");

  const calcClearText =
    document.getElementById("calc-clear-text");

  const calcClearBlocks =
    document.getElementById("calc-clear-blocks");

  const kcalElement =
    document.getElementById("kcal");

  const proteinElement =
    document.getElementById("protein");

  const fatElement =
    document.getElementById("fat");

  const carbElement =
    document.getElementById("carb");

  const copyTotal =
    document.getElementById("copy-total");

  const saveArchive =
    document.getElementById("save-archive");

  const calcLog =
    document.getElementById("calc-log");

  const archiveLog =
    document.getElementById("archive-log");

  const archiveTextModal =
    document.getElementById("archive-text-modal");

  const archiveTextInput =
    document.getElementById("archive-text-input");

  const archiveTextCancel =
    document.getElementById("archive-text-cancel");

  const archiveTextSave =
    document.getElementById("archive-text-save");


  /* =========================================================
     BUTTON STATE HELPERS
  ========================================================= */

  function clearButtonStatus(button) {
    if (!button) {
      return;
    }

    button.classList.remove(
      "button-status-success",
      "button-status-error",
      "button-status-info",
      "button-status-pulse"
    );
  }


  function showButtonState(
    button,
    text,
    state,
    duration = 1500
  ) {
    if (!button) {
      return;
    }

    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent.trim();
    }

    clearTimeout(button._statusTimeout);

    clearButtonStatus(button);

    button.textContent = text;

    if (state === "success") {
      button.classList.add(
        "button-status-success",
        "button-status-pulse"
      );
    }

    if (state === "error") {
      button.classList.add(
        "button-status-error",
        "button-status-pulse"
      );
    }

    if (state === "info") {
      button.classList.add(
        "button-status-info"
      );
    }

    if (duration > 0) {
      button._statusTimeout = setTimeout(() => {
        button.textContent =
          button.dataset.originalText || "";

        clearButtonStatus(button);
      }, duration);
    }
  }


  function setButtonStatusPermanent(
    button,
    text,
    state
  ) {
    if (!button) {
      return;
    }

    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent.trim();
    }

    clearTimeout(button._statusTimeout);
    clearButtonStatus(button);

    button.textContent = text;

    if (state === "success") {
      button.classList.add(
        "button-status-success",
        "button-status-pulse"
      );
    }

    if (state === "error") {
      button.classList.add(
        "button-status-error",
        "button-status-pulse"
      );
    }

    if (state === "info") {
      button.classList.add(
        "button-status-info"
      );
    }
  }


  /* =========================================================
     HELPERS
  ========================================================= */

  function createId(prefix = "id") {
    return (
      prefix +
      "-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 9)
    );
  }


  function number(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }


  function round(value, decimals = 1) {
    const factor = Math.pow(10, decimals);

    return Math.round(
      (number(value) + Number.EPSILON) * factor
    ) / factor;
  }


  function formatNumber(value) {
    const rounded = round(value, 1);

    if (Number.isInteger(rounded)) {
      return String(rounded);
    }

    return String(rounded).replace(".", ".");
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function getInitials(name) {
    const text = String(name || "").trim();

    if (!text) {
      return "?";
    }

    const words = text.split(/\s+/);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }


  function normalizeProduct(product) {
    return {
      id: String(product.id ?? createId("product")),
      name: String(product.name ?? "").trim(),
      kcal: number(product.kcal),
      protein: number(
        product.protein ?? product.proteins
      ),
      fat: number(product.fat),
      carb: number(
        product.carb ?? product.carbs
      ),
      unit: product.unit === "мл" ? "мл" : "г",
      full_name: String(
        product.full_name ??
        product.description ??
        ""
      ).trim()
    };
  }


  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function loadProductsFromLocal() {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(normalizeProduct)
        .filter(product => product.name);
    } catch (error) {
      console.error(
        "Помилка читання локальної бази продуктів:",
        error
      );

      return [];
    }
  }


  function saveProductsLocal() {
    try {
      localStorage.setItem(
        PRODUCTS_KEY,
        JSON.stringify(products)
      );

      return true;
    } catch (error) {
      console.error(
        "Помилка збереження продуктів:",
        error
      );

      return false;
    }
  }


  function loadCalculatorLocal() {
    try {
      const raw = localStorage.getItem(CALCULATOR_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(
        "Помилка читання калькулятора:",
        error
      );

      return [];
    }
  }


  function saveCalculatorLocal() {
    localStorage.setItem(
      CALCULATOR_KEY,
      JSON.stringify(calculatorItems)
    );
  }


  function loadArchiveLocal() {
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(
        "Помилка читання архіву:",
        error
      );

      return [];
    }
  }


  function saveArchiveLocal() {
    localStorage.setItem(
      ARCHIVE_KEY,
      JSON.stringify(archiveItems)
    );
  }


  /* =========================================================
     SUPABASE SESSION
  ========================================================= */

  async function getCurrentUser() {
    if (!supabaseClient) {
      return null;
    }

    try {
      const {
        data,
        error
      } = await supabaseClient.auth.getSession();

      if (error) {
        console.error(
          "Supabase session error:",
          error
        );

        return null;
      }

      return data?.session?.user || null;
    } catch (error) {
      console.error(
        "Supabase getSession error:",
        error
      );

      return null;
    }
  }


  /* =========================================================
     LOAD PRODUCTS FROM SUPABASE
  ========================================================= */

  async function loadProductsFromSupabase() {
    if (!supabaseClient) {
      return null;
    }

    try {
      const user = await getCurrentUser();

      let query = supabaseClient
        .from("products")
        .select(
          "id,name,unit,kcal,protein,fat,carbs,full_name,created_at"
        );

      if (user) {
        query = query.eq("owner_id", user.id);
      }

      const {
        data,
        error
      } = await query.order(
        "created_at",
        {
          ascending: true
        }
      );

      if (error) {
        console.error(
          "Supabase products load error:",
          error
        );

        return null;
      }

      if (!Array.isArray(data)) {
        return null;
      }

      if (data.length === 0) {
        return [];
      }

      return data.map(row =>
        normalizeProduct({
          id: row.id,
          name: row.name,
          unit: row.unit,
          kcal: row.kcal,
          protein: row.protein,
          fat: row.fat,
          carb: row.carbs,
          full_name: row.full_name
        })
      );
    } catch (error) {
      console.error(
        "Supabase products exception:",
        error
      );

      return null;
    }
  }


  /* =========================================================
     MERGE DATABASES
  ========================================================= */

  function mergeProducts(
    localProducts,
    cloudProducts
  ) {
    const result = [];
    const map = new Map();

    for (const product of localProducts) {
      const normalized =
        normalizeProduct(product);

      if (!normalized.name) {
        continue;
      }

      const key =
        normalized.id ||
        normalized.name.toLowerCase();

      map.set(key, normalized);
      result.push(normalized);
    }

    for (const product of cloudProducts || []) {
      const normalized =
        normalizeProduct(product);

      if (!normalized.name) {
        continue;
      }

      const existingById =
        map.get(normalized.id);

      if (existingById) {
        Object.assign(
          existingById,
          normalized
        );

        continue;
      }

      const existingByName =
        result.find(
          item =>
            item.name.toLowerCase() ===
            normalized.name.toLowerCase()
        );

      if (existingByName) {
        Object.assign(
          existingByName,
          normalized
        );
      } else {
        result.push(normalized);
      }
    }

    return result;
  }


  /* =========================================================
     SAVE PRODUCT TO SUPABASE
  ========================================================= */

  async function saveProductToSupabase(product) {
    if (!supabaseClient) {
      return false;
    }

    try {
      const user = await getCurrentUser();

      const payload = {
        name: product.name,
        unit: product.unit || "г",
        kcal: number(product.kcal),
        protein: number(product.protein),
        fat: number(product.fat),
        carbs: number(product.carb),
        full_name: product.full_name || ""
      };

      if (user) {
        payload.owner_id = user.id;
      }

      if (/^\d+$/.test(String(product.id))) {
        payload.id = Number(product.id);
      }

      const {
        data,
        error
      } = await supabaseClient
        .from("products")
        .upsert(
          payload,
          {
            onConflict: "id"
          }
        )
        .select()
        .single();

      if (error) {
        console.error(
          "Supabase product save error:",
          error
        );

        return false;
      }

      if (data?.id != null) {
        product.id = String(data.id);
        saveProductsLocal();
      }

      return true;
    } catch (error) {
      console.error(
        "Supabase save exception:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     DELETE PRODUCT FROM SUPABASE
  ========================================================= */

  async function deleteProductFromSupabase(product) {
    if (!supabaseClient) {
      return false;
    }

    if (!/^\d+$/.test(String(product.id))) {
      return false;
    }

    try {
      const user = await getCurrentUser();

      let query = supabaseClient
        .from("products")
        .delete()
        .eq("id", Number(product.id));

      if (user) {
        query = query.eq(
          "owner_id",
          user.id
        );
      }

      const {
        error
      } = await query;

      if (error) {
        console.error(
          "Supabase delete error:",
          error
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Supabase delete exception:",
        error
      );

      return false;
    }
  }


  /* =========================================================
     INITIAL DATABASE LOAD
  ========================================================= */

  async function initializeProducts() {
    const localProducts =
      loadProductsFromLocal();

    if (localProducts.length === 0) {
      products =
        DEFAULT_PRODUCTS.map(product =>
          normalizeProduct(product)
        );

      saveProductsLocal();
    } else {
      products = localProducts;
    }

    renderProducts();

    const cloudProducts =
      await loadProductsFromSupabase();

    if (cloudProducts === null) {
      console.warn(
        "Supabase недоступний. Використовується локальна база."
      );

      return;
    }

    if (cloudProducts.length === 0) {
      console.warn(
        "Supabase повернув порожню базу. Локальні продукти збережено."
      );

      return;
    }

    products = mergeProducts(
      products,
      cloudProducts
    );

    saveProductsLocal();

    renderProducts();
  }


  /* =========================================================
     SUPABASE SYNC
  ========================================================= */

  async function syncProductsToSupabase() {
    if (!supabaseClient) {
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    for (const product of products) {
      await saveProductToSupabase(product);
    }

    saveProductsLocal();
  }


  /* =========================================================
     TABS
  ========================================================= */

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach(item =>
        item.classList.remove("active")
      );

      pages.forEach(page =>
        page.classList.remove("active")
      );

      tab.classList.add("active");

      const targetPage =
        document.getElementById(target);

      if (targetPage) {
        targetPage.classList.add("active");
      }

      if (target === "archive") {
        renderArchive();
      }

      if (target === "calculator") {
        renderCalculatorLog();
        updateTotals();
      }
    });
  });


  /* =========================================================
     RENDER PRODUCTS
  ========================================================= */

  function renderProducts(filter = "") {
    if (!grid) {
      return;
    }

    const normalizedFilter =
      String(filter)
        .trim()
        .toLowerCase();

    grid.innerHTML = "";

    const filtered =
      products.filter(product => {
        if (!normalizedFilter) {
          return true;
        }

        return (
          product.name
            .toLowerCase()
            .includes(normalizedFilter) ||
          product.full_name
            .toLowerCase()
            .includes(normalizedFilter)
        );
      });

    if (filtered.length === 0) {
      const empty =
        document.createElement("div");

      empty.style.gridColumn = "1 / -1";
      empty.style.textAlign = "center";
      empty.style.padding = "30px";
      empty.style.color =
        "var(--text-secondary)";

      empty.textContent =
        "Продуктів не знайдено.";

      grid.appendChild(empty);

      return;
    }

    filtered.forEach(product => {
      const card =
        createProductCard(product);

      grid.appendChild(card);
    });

    updateReorderState();
  }


  /* =========================================================
     CREATE PRODUCT CARD
  ========================================================= */

  function createProductCard(product) {
    const card =
      document.createElement("article");

    card.className = "food-card";

    card.dataset.id =
      String(product.id);

    card.dataset.text =
      product.name;

    card.dataset.kcal =
      String(product.kcal);

    card.dataset.protein =
      String(product.protein);

    card.dataset.fat =
      String(product.fat);

    card.dataset.carb =
      String(product.carb);


    const copyButton =
      document.createElement("div");

    copyButton.className =
      "copy-btn";

    copyButton.title =
      "Скопіювати блок";

    copyButton.innerHTML = `
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 21H6a2 2 0 0 1-2-2V7"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <rect
          x="8"
          y="3"
          width="13"
          height="13"
          rx="2"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span class="tooltip">
        Скопійовано
      </span>
    `;

    copyButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        openProductModal(product);
      }
    );


    const title =
      document.createElement("div");

    title.className =
      "food-title";

    title.style.paddingRight =
      "50px";


    const badge =
      document.createElement("div");

    badge.className =
      "badge";

    badge.textContent =
      getInitials(product.name);


    const titleContent =
      document.createElement("div");


    const name =
      document.createElement("div");

    name.className =
      "name";

    name.textContent =
      product.name;


    const meta =
      document.createElement("div");

    meta.className =
      "meta";

    meta.textContent =
      `100 ${product.unit || "г"}`;


    titleContent.appendChild(name);
    titleContent.appendChild(meta);

    title.appendChild(badge);
    title.appendChild(titleContent);


    const kbjv =
      document.createElement("div");

    kbjv.className =
      "kbjv";

    kbjv.innerHTML = `
      <div class="row">
        <div class="key">Калорії</div>
        <div class="val">
          ${formatNumber(product.kcal)} ккал
        </div>
      </div>

      <div class="row">
        <div class="key">Білки</div>
        <div class="val">
          ${formatNumber(product.protein)} г
        </div>
      </div>

      <div class="row">
        <div class="key">Жири</div>
        <div class="val">
          ${formatNumber(product.fat)} г
        </div>
      </div>

      <div class="row">
        <div class="key">Вуглеводи</div>
        <div class="val">
          ${formatNumber(product.carb)} г
        </div>
      </div>
    `;


    const fullName =
      document.createElement("div");

    fullName.className =
      "full-name";

    fullName.textContent =
      product.full_name || "";


    card.appendChild(copyButton);
    card.appendChild(title);
    card.appendChild(kbjv);
    card.appendChild(fullName);


    card.addEventListener(
      "click",
      event => {
        if (reorderMode) {
          return;
        }

        if (
          event.target.closest(".copy-btn")
        ) {
          return;
        }

        openProductModal(product);
      }
    );


    return card;
  }


  /* =========================================================
     SEARCH
  ========================================================= */

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      () => {
        renderProducts(
          searchInput.value
        );

        if (clearSearch) {
          clearSearch.style.display =
            searchInput.value
              ? "block"
              : "none";
        }
      }
    );
  }


  if (clearSearch) {
    clearSearch.addEventListener(
      "click",
      () => {
        searchInput.value = "";

        clearSearch.style.display =
          "none";

        renderProducts();

        searchInput.focus();
      }
    );
  }


  /* =========================================================
     PRODUCT MODAL
  ========================================================= */

  function openProductModal(product) {
    selectedProduct = product;

    if (productModalName) {
      productModalName.textContent =
        product.name;
    }

    if (productWeight) {
      productWeight.value = "100";
    }

    if (productModal) {
      productModal.classList.add("active");
    }
  }


  function closeProductModal() {
    selectedProduct = null;

    if (productModal) {
      productModal.classList.remove("active");
    }
  }


  /* =========================================================
     PRODUCT CANCEL
  ========================================================= */

  if (productCancel) {
    productCancel.addEventListener(
      "click",
      () => {
        closeProductModal();

        /*
         * Повністю червоний стан самої кнопки.
         */
        showButtonState(
          productCancel,
          "Скасовано",
          "error",
          1500
        );
      }
    );
  }


  if (productModal) {
    productModal.addEventListener(
      "click",
      event => {
        if (
          event.target === productModal
        ) {
          closeProductModal();

          /*
           * Якщо закрили модальне вікно кліком
           * поза ним — також показуємо,
           * що операцію скасовано.
           */
          showButtonState(
            productCancel,
            "Скасовано",
            "error",
            1500
          );
        }
      }
    );
  }


  /* =========================================================
     CALCULATE PRODUCT WEIGHT
  ========================================================= */

  function calculateProduct(
    product,
    weight
  ) {
    const multiplier =
      number(weight) / 100;

    return {
      kcal:
        product.kcal * multiplier,

      protein:
        product.protein * multiplier,

      fat:
        product.fat * multiplier,

      carb:
        product.carb * multiplier
    };
  }


  /* =========================================================
     COPY
  ========================================================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);

      return true;
    } catch (error) {
      try {
        const textarea =
          document.createElement("textarea");

        textarea.value = text;

        textarea.style.position =
          "fixed";

        textarea.style.left =
          "-9999px";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        return true;
      } catch (fallbackError) {
        console.error(
          "Clipboard error:",
          fallbackError
        );

        return false;
      }
    }
  }


  function getProductSummary(
    product,
    weight
  ) {
    const values =
      calculateProduct(
        product,
        weight
      );

    return `${product.name}, для ${formatNumber(weight)} грам - ${formatNumber(values.kcal)} ккал / ${formatNumber(values.protein)} білка / ${formatNumber(values.fat)} жирів / ${formatNumber(values.carb)} вуглеводів`;
  }


  if (productCopy) {
    productCopy.addEventListener(
      "click",
      async () => {
        if (!selectedProduct) {
          return;
        }

        const weight =
          number(productWeight.value);

        if (weight <= 0) {
          productWeight.focus();

          return;
        }

        const text =
          getProductSummary(
            selectedProduct,
            weight
          );

        const success =
          await copyText(text);

        if (success) {
          productCopy.classList.add(
            "success"
          );

          productCopy.textContent =
            "Скопійовано ✓";

          setTimeout(() => {
            if (productCopy) {
              productCopy.classList.remove(
                "success"
              );

              productCopy.textContent =
                "Скопіювати";
            }
          }, 1200);
        }
      }
    );
  }


/* =========================================================
   PRODUCT -> CALCULATOR
========================================================= */

if (productCalculator) {
  productCalculator.addEventListener(
    "click",
    () => {
      if (!selectedProduct) {
        return;
      }

      const weight =
        number(productWeight.value);

      if (weight <= 0) {
        productWeight.focus();

        return;
      }

      const text =
        getProductSummary(
          selectedProduct,
          weight
        );

      /*
       * Передаємо дані в поле калькулятора.
       */
      if (calcInput) {
        calcInput.value = text;
      }

      closeProductModal();

      /*
       * Кнопка стає зеленою:
       * "Додано ✓"
       */
      showButtonState(
        productCalculator,
        "Додано",
        "success",
        1500
      );
    }
  );
}


  /* =========================================================
     ADD PRODUCT MODAL
  ========================================================= */

  function openAddProductModal() {
    newProductName.value = "";
    newProductKcal.value = "";
    newProductProtein.value = "";
    newProductFat.value = "";
    newProductCarb.value = "";
    newProductDescription.value = "";

    addProductModal.classList.add(
      "active"
    );

    setTimeout(() => {
      newProductName.focus();
    }, 50);
  }


  function closeAddProductModal() {
    addProductModal.classList.remove(
      "active"
    );
  }


  if (addProductButton) {
    addProductButton.addEventListener(
      "click",
      openAddProductModal
    );
  }


  /* =========================================================
     ADD PRODUCT CANCEL
  ========================================================= */

  if (addProductCancel) {
    addProductCancel.addEventListener(
      "click",
      () => {
        closeAddProductModal();

        showButtonState(
          addProductSave,
          "Скасовано",
          "error",
          1500
        );

        showButtonState(
          addProductButton,
          "Продукт не додано",
          "error",
          1500
        );
      }
    );
  }


  if (addProductModal) {
    addProductModal.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          addProductModal
        ) {
          closeAddProductModal();

          showButtonState(
            addProductSave,
            "Скасовано",
            "error",
            1500
          );

          showButtonState(
            addProductButton,
            "Продукт не додано",
            "error",
            1500
          );
        }
      }
    );
  }


  /* =========================================================
     ADD PRODUCT SAVE
  ========================================================= */

  if (addProductSave) {
    addProductSave.addEventListener(
      "click",
      async () => {
        const name =
          newProductName.value.trim();

        if (!name) {
          newProductName.focus();

          return;
        }

        const product = {
          id: createId("product"),
          name,
          kcal: number(
            newProductKcal.value
          ),
          protein: number(
            newProductProtein.value
          ),
          fat: number(
            newProductFat.value
          ),
          carb: number(
            newProductCarb.value
          ),
          unit: "г",
          full_name:
            newProductDescription.value.trim()
        };


        /*
         * LOCAL
         */

        products.push(product);

        saveProductsLocal();

        renderProducts(
          searchInput?.value || ""
        );

        closeAddProductModal();


        /*
         * BUTTON ANIMATION
         */

        showButtonState(
          addProductSave,
          "Збережено",
          "success",
          1500
        );

        showButtonState(
          addProductButton,
          "Продукт додано",
          "success",
          1500
        );


        /*
         * SUPABASE
         */

        const cloudSaved =
          await saveProductToSupabase(
            product
          );

        if (cloudSaved) {
          saveProductsLocal();

          renderProducts(
            searchInput?.value || ""
          );
        }
      }
    );
  }


  /* =========================================================
     DELETE PRODUCT MODAL
  ========================================================= */

  function openDeleteProductModal() {
    renderDeleteProductList();

    deleteProductModal.classList.add(
      "active"
    );
  }


  function closeDeleteProductModal() {
    deleteProductModal.classList.remove(
      "active"
    );
  }


  if (deleteProductButton) {
    deleteProductButton.addEventListener(
      "click",
      openDeleteProductModal
    );
  }


  /* =========================================================
     DELETE PRODUCT CANCEL
  ========================================================= */

  if (deleteProductCancel) {
    deleteProductCancel.addEventListener(
      "click",
      () => {
        closeDeleteProductModal();

        showButtonState(
          deleteProductButton,
          "Продукт не видалено",
          "error",
          1500
        );
      }
    );
  }


  if (deleteProductModal) {
    deleteProductModal.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          deleteProductModal
        ) {
          closeDeleteProductModal();

          showButtonState(
            deleteProductButton,
            "Продукт не видалено",
            "error",
            1500
          );
        }
      }
    );
  }


  /* =========================================================
     DELETE PRODUCT LIST
  ========================================================= */

  function renderDeleteProductList() {
    deleteProductList.innerHTML = "";

    if (products.length === 0) {
      deleteProductList.innerHTML = `
        <div class="delete-product-empty">
          База продуктів порожня.
        </div>
      `;

      return;
    }


    products.forEach(product => {
      const item =
        document.createElement("div");

      item.className =
        "delete-product-item";


      const name =
        document.createElement("div");

      name.className =
        "delete-product-item-name";

      name.textContent =
        product.name;


      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "delete-product-item-button";

      button.textContent =
        "Видалити";


      button.addEventListener(
        "click",
        async () => {
          const confirmed =
            confirm(
              `Видалити продукт "${product.name}"?`
            );


          if (!confirmed) {
            showButtonState(
              deleteProductButton,
              "Скасовано",
              "error",
              1500
            );

            return;
          }


          products =
            products.filter(
              item =>
                String(item.id) !==
                String(product.id)
            );

          saveProductsLocal();

          renderProducts(
            searchInput?.value || ""
          );

          renderDeleteProductList();


          await deleteProductFromSupabase(
            product
          );


          showButtonState(
            deleteProductButton,
            "Продукт видалено",
            "success",
            1500
          );
        }
      );


      item.appendChild(name);
      item.appendChild(button);

      deleteProductList.appendChild(item);
    });
  }


  /* =========================================================
     REORDER PRODUCTS
  ========================================================= */

  if (reorderProductsButton) {
    reorderProductsButton.addEventListener(
      "click",
      () => {

        if (!reorderMode) {
          reorderMode = true;
          reorderChanged = false;

          setButtonStatusPermanent(
            reorderProductsButton,
            "Завершити зміну розташування?",
            "info"
          );

          updateReorderState();

          return;
        }


        reorderMode = false;

        updateReorderState();


        if (reorderChanged) {
          showButtonState(
            reorderProductsButton,
            "Розташування змінено",
            "success",
            1800
          );
        } else {
          showButtonState(
            reorderProductsButton,
            "Розташування не змінено",
            "error",
            1800
          );
        }
      }
    );
  }


  function updateReorderState() {
    if (!grid) {
      return;
    }

    grid.classList.toggle(
      "reorder-mode",
      reorderMode
    );

    reorderHint?.classList.toggle(
      "active",
      reorderMode
    );


    if (
      reorderMode &&
      reorderProductsButton &&
      !reorderProductsButton.classList.contains(
        "button-status-info"
      )
    ) {
      setButtonStatusPermanent(
        reorderProductsButton,
        "Завершити зміну розташування?",
        "info"
      );
    }


    const cards =
      grid.querySelectorAll(
        ".food-card"
      );

    cards.forEach(card => {
      card.draggable =
        reorderMode;

      if (reorderMode) {
        attachDragEvents(card);
      } else {
        card.ondragstart = null;
        card.ondragend = null;
        card.ondragover = null;
        card.ondragleave = null;
        card.ondrop = null;
      }
    });
  }


  function attachDragEvents(card) {
    card.ondragstart = event => {
      if (!reorderMode) {
        event.preventDefault();

        return;
      }

      draggedCard = card;

      card.classList.add(
        "dragging"
      );

      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        card.dataset.id
      );
    };


    card.ondragend = () => {
      card.classList.remove(
        "dragging"
      );

      grid
        .querySelectorAll(
          ".food-card"
        )
        .forEach(item =>
          item.classList.remove(
            "drag-over"
          )
        );

      draggedCard = null;
    };


    card.ondragover = event => {
      if (!reorderMode) {
        return;
      }

      event.preventDefault();

      if (
        !draggedCard ||
        draggedCard === card
      ) {
        return;
      }

      card.classList.add(
        "drag-over"
      );
    };


    card.ondragleave = () => {
      card.classList.remove(
        "drag-over"
      );
    };


    card.ondrop = event => {
      if (!reorderMode) {
        return;
      }

      event.preventDefault();

      card.classList.remove(
        "drag-over"
      );

      if (
        !draggedCard ||
        draggedCard === card
      ) {
        return;
      }

      const draggedId =
        String(
          draggedCard.dataset.id
        );

      const targetId =
        String(
          card.dataset.id
        );

      const fromIndex =
        products.findIndex(
          item =>
            String(item.id) ===
            draggedId
        );

      const toIndex =
        products.findIndex(
          item =>
            String(item.id) ===
            targetId
        );

      if (
        fromIndex === -1 ||
        toIndex === -1
      ) {
        return;
      }


      const [
        movedProduct
      ] = products.splice(
        fromIndex,
        1
      );

      products.splice(
        toIndex,
        0,
        movedProduct
      );


      reorderChanged = true;

      saveProductsLocal();

      renderProducts(
        searchInput?.value || ""
      );


      setButtonStatusPermanent(
        reorderProductsButton,
        "Завершити зміну розташування?",
        "info"
      );
    };
  }


  /* =========================================================
     EXPORT DATABASE
  ========================================================= */

  if (exportButton) {
    exportButton.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            `Експортувати базу продуктів?\n\nБуде експортовано ${products.length} продуктів.`
          );


        if (!confirmed) {
          showButtonState(
            exportButton,
            "Не експортовано",
            "error",
            1800
          );

          return;
        }


        const exportData = {
          version: 1,

          exported_at:
            new Date().toISOString(),

          products:
            products.map(
              product =>
                normalizeProduct(product)
            )
        };


        const json =
          JSON.stringify(
            exportData,
            null,
            2
          );


        const blob =
          new Blob(
            [json],
            {
              type:
                "application/json"
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement("a");

        link.href = url;


        const date =
          new Date()
            .toISOString()
            .slice(0, 10);


        link.download =
          `kbjv-database-${date}.json`;


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        showButtonState(
          exportButton,
          "Експортовано",
          "success",
          1800
        );
      }
    );
  }


  /* =========================================================
     IMPORT DATABASE
  ========================================================= */

  let importDialogOpened = false;

  if (importButton) {
    importButton.addEventListener(
      "click",
      () => {
        importDialogOpened = true;

        importFile?.click();
      }
    );
  }


  window.addEventListener(
    "focus",
    () => {
      if (!importDialogOpened) {
        return;
      }

      setTimeout(() => {
        if (!importFile) {
          return;
        }

        if (
          !importFile.files ||
          importFile.files.length === 0
        ) {
          showButtonState(
            importButton,
            "Не імпортовано",
            "error",
            1500
          );
        }

        importDialogOpened = false;
      }, 150);
    }
  );


  if (importFile) {
    importFile.addEventListener(
      "change",
      async () => {
        const file =
          importFile.files?.[0];


        if (!file) {
          showButtonState(
            importButton,
            "Не імпортовано",
            "error",
            1500
          );

          importDialogOpened = false;
          return;
        }


        try {
          const text =
            await file.text();

          const parsed =
            JSON.parse(text);


          let importedProducts = null;


          if (
            Array.isArray(
              parsed
            )
          ) {
            importedProducts =
              parsed;

          } else if (
            Array.isArray(
              parsed.products
            )
          ) {
            importedProducts =
              parsed.products;
          }


          if (
            !Array.isArray(
              importedProducts
            )
          ) {
            throw new Error(
              "Невірний формат JSON."
            );
          }


          const normalized =
            importedProducts
              .map(normalizeProduct)
              .filter(
                product =>
                  product.name
              );


          if (
            normalized.length === 0
          ) {
            throw new Error(
              "У файлі немає продуктів."
            );
          }


          const confirmed =
            confirm(
              `Імпортувати ${normalized.length} продуктів?\n\nПоточна локальна база буде замінена імпортованою.`
            );


          if (!confirmed) {
            importFile.value = "";

            showButtonState(
              importButton,
              "Не імпортовано",
              "error",
              1500
            );

            importDialogOpened = false;

            return;
          }


          products = normalized;

          saveProductsLocal();

          renderProducts(
            searchInput?.value || ""
          );


          await syncProductsToSupabase();


          showButtonState(
            importButton,
            "Імпортовано",
            "success",
            1500
          );

        } catch (error) {
          console.error(
            "Import error:",
            error
          );


          showButtonState(
            importButton,
            "Не імпортовано",
            "error",
            1500
          );

          alert(
            "Не вдалося імпортувати базу.\n\nПеревірте JSON-файл."
          );
        }


        importFile.value = "";
        importDialogOpened = false;
      }
    );
  }


  /* =========================================================
     CALCULATOR PARSER
  ========================================================= */

  function parseCalculatorLine(line) {
    const clean =
      String(line)
        .trim()
        .replace(/\s+/g, " ");

    if (!clean) {
      return null;
    }


    const regex =
      /^(.+?),\s*для\s*([\d.,]+)\s*(?:грам|г|мл)\s*-\s*([\d.,]+)\s*ккал\s*\/\s*([\d.,]+)\s*білка\s*\/\s*([\d.,]+)\s*жирів\s*\/\s*([\d.,]+)\s*вуглеводів/i;

    const match =
      clean.match(regex);


    if (!match) {
      return null;
    }


    const productName =
      match[1].trim();

    const weight =
      number(
        match[2].replace(",", ".")
      );

    const kcal =
      number(
        match[3].replace(",", ".")
      );

    const protein =
      number(
        match[4].replace(",", ".")
      );

    const fat =
      number(
        match[5].replace(",", ".")
      );

    const carb =
      number(
        match[6].replace(",", ".")
      );


    if (
      !productName ||
      weight <= 0
    ) {
      return null;
    }


    return {
      id: createId("calc"),
      name: productName,
      weight,
      kcal,
      protein,
      fat,
      carb,
      text: clean,
      created_at:
        new Date().toISOString()
    };
  }


  /* =========================================================
     CALCULATOR ADD
  ========================================================= */

  if (calcAdd) {
    calcAdd.addEventListener(
      "click",
      () => {
        const text =
          calcInput?.value.trim() || "";

        /*
         * Немає абсолютно нічого в полі.
         */
        if (!text) {
          showButtonState(
            calcAdd,
            "Немає даних",
            "error",
            1500
          );

          return;
        }


        const lines =
          text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);


        const parsedItems = [];


        for (const line of lines) {
          const parsed =
            parseCalculatorLine(line);

          if (parsed) {
            parsedItems.push(parsed);
          }
        }


        /*
         * Текст є, але формат неправильний.
         */
        if (
          parsedItems.length === 0
        ) {
          showButtonState(
            calcAdd,
            "Немає даних",
            "error",
            1500
          );

          alert(
            "Не вдалося розпізнати дані.\n\nВикористовуйте формат:\nПродукт, для 250 грам - 375 ккал / 30 білка / 25 жирів / 2 вуглеводів"
          );

          return;
        }


        calculatorItems.push(
          ...parsedItems
        );

        saveCalculatorLocal();

        renderCalculatorLog();

        updateTotals();


        showButtonState(
          calcAdd,
          "Додано",
          "success",
          1500
        );
      }
    );
  }


  /* =========================================================
     CALCULATOR CLEAR TEXT
  ========================================================= */

  if (calcClearText) {
    calcClearText.addEventListener(
      "click",
      () => {
        const hasText =
          Boolean(
            calcInput?.value.trim()
          );

        /*
         * Нічого очищати.
         */
        if (!hasText) {
          showButtonState(
            calcClearText,
            "Немає даних",
            "error",
            1500
          );

          return;
        }


        calcInput.value = "";

        showButtonState(
          calcClearText,
          "Очищено",
          "success",
          1500
        );
      }
    );
  }


  /* =========================================================
     CALCULATOR CLEAR BLOCKS
  ========================================================= */

  if (calcClearBlocks) {
    calcClearBlocks.addEventListener(
      "click",
      () => {
        /*
         * Немає блоків.
         */
        if (
          calculatorItems.length === 0
        ) {
          showButtonState(
            calcClearBlocks,
            "Немає даних",
            "error",
            1500
          );

          return;
        }


        const confirmed =
          confirm(
            "Очистити всю історію калькулятора?"
          );


        /*
         * Користувач натиснув Скасувати
         * у confirm.
         */
        if (!confirmed) {
          showButtonState(
            calcClearBlocks,
            "Не очищено",
            "error",
            1500
          );

          return;
        }


        calculatorItems = [];

        saveCalculatorLocal();

        renderCalculatorLog();

        updateTotals();


        showButtonState(
          calcClearBlocks,
          "Очищено",
          "success",
          1500
        );
      }
    );
  }


  /* =========================================================
     CALCULATOR TOTALS
  ========================================================= */

  function updateTotals() {
    let kcal = 0;
    let protein = 0;
    let fat = 0;
    let carb = 0;


    calculatorItems.forEach(item => {
      kcal += number(item.kcal);
      protein += number(item.protein);
      fat += number(item.fat);
      carb += number(item.carb);
    });


    kcalElement.textContent =
      formatNumber(kcal);

    proteinElement.textContent =
      formatNumber(protein);

    fatElement.textContent =
      formatNumber(fat);

    carbElement.textContent =
      formatNumber(carb);
  }


  /* =========================================================
     CALCULATOR LOG
  ========================================================= */

  function renderCalculatorLog() {
    if (!calcLog) {
      return;
    }

    calcLog.innerHTML = "";


    if (
      calculatorItems.length === 0
    ) {
      calcLog.innerHTML = `
        <div style="padding:10px 0;">
          Історія порожня.
        </div>
      `;

      return;
    }


    calculatorItems.forEach(
      (item, index) => {
        const row =
          document.createElement("div");

        row.className =
          "log-item";


        const text =
          document.createElement("span");

        text.textContent =
          item.text ||
          `${item.name}, для ${formatNumber(item.weight)} грам - ${formatNumber(item.kcal)} ккал / ${formatNumber(item.protein)} білка / ${formatNumber(item.fat)} жирів / ${formatNumber(item.carb)} вуглеводів`;


        const remove =
          document.createElement("button");

        remove.className =
          "remove";

        remove.textContent =
          "Видалити";


        remove.addEventListener(
          "click",
          () => {
            calculatorItems.splice(
              index,
              1
            );

            saveCalculatorLocal();

            renderCalculatorLog();

            updateTotals();
          }
        );


        row.appendChild(text);
        row.appendChild(remove);

        calcLog.appendChild(row);
      }
    );
  }


  /* =========================================================
     COPY TOTAL
  ========================================================= */

  function getTotalSummary() {
    return `Денний підсумок: ${formatNumber(number(kcalElement.textContent))} ккал / ${formatNumber(number(proteinElement.textContent))} білка / ${formatNumber(number(fatElement.textContent))} жирів / ${formatNumber(number(carbElement.textContent))} вуглеводів`;
  }


  if (copyTotal) {
    copyTotal.addEventListener(
      "click",
      async () => {
        const text =
          getTotalSummary();

        const success =
          await copyText(text);

        if (success) {
          showButtonState(
            copyTotal,
            "Скопійовано",
            "success",
            1500
          );
        }
      }
    );
  }


  /* =========================================================
     ARCHIVE
  ========================================================= */

  function createArchiveItem() {
    return {
      id: createId("archive"),
      date: getCurrentDate(),
      text: getTotalSummary(),
      created_at:
        new Date().toISOString()
    };
  }


  function getCurrentDate() {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  /* =========================================================
     SAVE TO ARCHIVE
  ========================================================= */

  if (saveArchive) {
    saveArchive.addEventListener(
      "click",
      () => {
        if (
          calculatorItems.length === 0
        ) {
          alert(
            "Немає даних для збереження в архів."
          );

          return;
        }


        const archiveItem =
          createArchiveItem();

        archiveItems.unshift(
          archiveItem
        );

        saveArchiveLocal();

        renderArchive();


        showButtonState(
          saveArchive,
          "Збережено",
          "success",
          1500
        );
      }
    );
  }


  /* =========================================================
     RENDER ARCHIVE
  ========================================================= */

  function renderArchive() {
    if (!archiveLog) {
      return;
    }

    archiveLog.innerHTML = "";


    if (
      archiveItems.length === 0
    ) {
      archiveLog.innerHTML = `
        <div style="padding:10px 0;">
          Архів порожній.
        </div>
      `;

      return;
    }


    archiveItems.forEach(item => {
      const row =
        document.createElement("div");

      row.className =
        "log-item archive-item";


      const content =
        document.createElement("div");

      content.className =
        "archive-content";


      const date =
        document.createElement("div");

      date.style.fontWeight =
        "600";

      date.style.color =
        "var(--text-main)";

      date.textContent =
        formatArchiveDate(
          item.date
        );


      const text =
        document.createElement("div");

      text.textContent =
        item.text;


      content.appendChild(date);
      content.appendChild(text);


      const actions =
        document.createElement("div");

      actions.className =
        "archive-actions";


      /* =====================================================
         DATE BUTTON
      ===================================================== */

      const editDate =
        document.createElement("button");

      editDate.className =
        "edit-date";

      editDate.textContent =
        "Дата";


      /* =====================================================
         TEXT BUTTON
      ===================================================== */

      const editText =
        document.createElement("button");

      editText.className =
        "edit-text";

      editText.textContent =
        "Текст";


      /* =====================================================
         DELETE
      ===================================================== */

      const remove =
        document.createElement("button");

      remove.className =
        "remove";

      remove.textContent =
        "Видалити";


      /* =====================================================
         EDIT DATE
      ===================================================== */

      editDate.addEventListener(
        "click",
        () => {
          editArchiveDate(
            item,
            date,
            editDate
          );
        }
      );


      /* =====================================================
         EDIT TEXT
      ===================================================== */

      editText.addEventListener(
        "click",
        () => {
          openArchiveTextModal(
            item,
            editText
          );
        }
      );


      /* =====================================================
         REMOVE ARCHIVE ITEM
      ===================================================== */

      remove.addEventListener(
        "click",
        () => {
          const confirmed =
            confirm(
              "Видалити цей запис з архіву?"
            );

          if (!confirmed) {
            return;
          }

          archiveItems =
            archiveItems.filter(
              archive =>
                archive.id !==
                item.id
            );

          saveArchiveLocal();

          renderArchive();
        }
      );


      actions.appendChild(editDate);
      actions.appendChild(editText);
      actions.appendChild(remove);


      row.appendChild(content);
      row.appendChild(actions);

      archiveLog.appendChild(row);
    });
  }


  /* =========================================================
     FORMAT ARCHIVE DATE
  ========================================================= */

  function formatArchiveDate(value) {
    if (!value) {
      return "";
    }

    const match =
      String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return value;
    }

    return `${match[3]}.${match[2]}.${match[1]}`;
  }


  /* =========================================================
     EDIT ARCHIVE DATE
  ========================================================= */

  function editArchiveDate(
    item,
    dateElement,
    button
  ) {
    if (
      dateElement.querySelector(
        ".archive-date-input"
      )
    ) {
      return;
    }


    const originalDate =
      item.date || "";


    const input =
      document.createElement("input");

    input.type = "date";

    input.className =
      "archive-date-input";

    input.value =
      originalDate || getCurrentDate();


    dateElement.textContent = "";

    dateElement.appendChild(input);

    input.focus();


    let finished = false;


    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;


      const newDate =
        input.value || "";


      /*
       * Дату реально змінили.
       */
      if (
        newDate &&
        newDate !== originalDate
      ) {
        item.date =
          newDate;

        saveArchiveLocal();

        renderArchive();

        /*
         * Після renderArchive стара кнопка
         * вже знищена, тому знаходимо нову
         * кнопку для цього запису.
         */
        const newButton =
          findArchiveActionButton(
            item.id,
            "edit-date"
          );

        showButtonState(
          newButton,
          "Змінено",
          "success",
          1500
        );

        return;
      }


      /*
       * Нічого не змінили.
       */
      renderArchive();

      const newButton =
        findArchiveActionButton(
          item.id,
          "edit-date"
        );

      showButtonState(
        newButton,
        "Не змінено",
        "error",
        1500
      );
    };


    input.addEventListener(
      "change",
      finish,
      {
        once: true
      }
    );

    input.addEventListener(
      "blur",
      finish,
      {
        once: true
      }
    );
  }


  /* =========================================================
     FIND ARCHIVE ACTION BUTTON
  ========================================================= */

  function findArchiveActionButton(
    itemId,
    className
  ) {
    if (!archiveLog) {
      return null;
    }

    const rows =
      archiveLog.querySelectorAll(
        ".archive-item"
      );

    for (const row of rows) {
      const buttons =
        row.querySelectorAll(
          "button"
        );

      /*
       * У кожному рядку кнопки йдуть:
       * Дата / Текст / Видалити.
       */
      const item =
        archiveItems.find(
          archive =>
            archive.id === itemId
        );

      if (!item) {
        continue;
      }

      if (
        className === "edit-date" &&
        row.querySelector(".edit-date")
      ) {
        return row.querySelector(
          ".edit-date"
        );
      }

      if (
        className === "edit-text" &&
        row.querySelector(".edit-text")
      ) {
        return row.querySelector(
          ".edit-text"
        );
      }
    }

    return null;
  }


  /* =========================================================
     EDIT ARCHIVE TEXT MODAL
  ========================================================= */

  function openArchiveTextModal(
    item,
    button
  ) {
    archiveEditingId =
      item.id;

    archiveOriginalText =
      item.text || "";

    /*
     * Зберігаємо кнопку, щоб після Save/Cancel
     * показати статус саме на кнопці "Текст".
     */
    archiveTextInput._archiveButton =
      button;

    archiveTextInput.value =
      item.text || "";

    archiveTextModal.classList.add(
      "active"
    );

    setTimeout(() => {
      archiveTextInput.focus();
      archiveTextInput.select();
    }, 50);
  }


  function closeArchiveTextModal() {
    archiveEditingId = null;
    archiveOriginalText = null;

    if (archiveTextInput) {
      archiveTextInput._archiveButton =
        null;
    }

    archiveTextModal.classList.remove(
      "active"
    );
  }


  if (archiveTextCancel) {
    archiveTextCancel.addEventListener(
      "click",
      () => {
        const item =
          archiveItems.find(
            archive =>
              archive.id ===
              archiveEditingId
          );

        const button =
          archiveTextInput?._archiveButton;

        /*
         * При скасуванні нічого не змінили.
         */
        closeArchiveTextModal();

        if (button) {
          showButtonState(
            button,
            "Не змінено",
            "error",
            1500
          );
        }
      }
    );
  }


  if (archiveTextModal) {
    archiveTextModal.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          archiveTextModal
        ) {
          const button =
            archiveTextInput?._archiveButton;

          closeArchiveTextModal();

          if (button) {
            showButtonState(
              button,
              "Не змінено",
              "error",
              1500
            );
          }
        }
      }
    );
  }


  if (archiveTextSave) {
    archiveTextSave.addEventListener(
      "click",
      () => {
        if (!archiveEditingId) {
          return;
        }


        const item =
          archiveItems.find(
            archive =>
              archive.id ===
              archiveEditingId
          );


        if (!item) {
          closeArchiveTextModal();

          return;
        }


        const button =
          archiveTextInput?._archiveButton;


        const text =
          archiveTextInput.value.trim();


        if (!text) {
          archiveTextInput.focus();

          return;
        }


        const changed =
          text !==
          archiveOriginalText;


        /*
         * Реально змінили текст.
         */
        if (changed) {
          item.text = text;

          saveArchiveLocal();

          closeArchiveTextModal();

          renderArchive();

          const newButton =
            findArchiveActionButton(
              item.id,
              "edit-text"
            );

          showButtonState(
            newButton || button,
            "Змінено",
            "success",
            1500
          );

          return;
        }


        /*
         * Текст залишився таким самим.
         */
        closeArchiveTextModal();

        showButtonState(
          button,
          "Не змінено",
          "error",
          1500
        );
      }
    );
  }


  /* =========================================================
     ESCAPE CLOSE MODALS
  ========================================================= */

  document.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape") {
        return;
      }


      if (
        addProductModal?.classList.contains(
          "active"
        )
      ) {
        addProductModal.classList.remove(
          "active"
        );

        showButtonState(
          addProductSave,
          "Скасовано",
          "error",
          1500
        );

        showButtonState(
          addProductButton,
          "Продукт не додано",
          "error",
          1500
        );
      }


      if (
        deleteProductModal?.classList.contains(
          "active"
        )
      ) {
        deleteProductModal.classList.remove(
          "active"
        );

        showButtonState(
          deleteProductButton,
          "Скасовано",
          "error",
          1500
        );
      }


      /*
       * Якщо Escape закрив модальне вікно
       * продукту — кнопка Скасувати червона.
       */
      if (
        productModal?.classList.contains(
          "active"
        )
      ) {
        productModal.classList.remove(
          "active"
        );

        showButtonState(
          productCancel,
          "Скасовано",
          "error",
          1500
        );
      }


      /*
       * Escape у вікні тексту архіву —
       * змін не збережено.
       */
      if (
        archiveTextModal?.classList.contains(
          "active"
        )
      ) {
        const button =
          archiveTextInput?._archiveButton;

        archiveTextModal.classList.remove(
          "active"
        );

        archiveEditingId = null;
        archiveOriginalText = null;

        if (archiveTextInput) {
          archiveTextInput._archiveButton =
            null;
        }

        showButtonState(
          button,
          "Не змінено",
          "error",
          1500
        );
      }


      selectedProduct = null;
      archiveEditingId = null;
    }
  );


  /* =========================================================
     ENTER IN PRODUCT WEIGHT
  ========================================================= */

  if (productWeight) {
    productWeight.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          productCopy?.click();
        }
      }
    );
  }


  /* =========================================================
     ENTER IN ADD PRODUCT FORM
  ========================================================= */

  [
    newProductName,
    newProductKcal,
    newProductProtein,
    newProductFat,
    newProductCarb
  ].forEach(input => {
    input?.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          addProductSave?.click();
        }
      }
    );
  });


  /* =========================================================
     INITIALIZATION
  ========================================================= */

  calculatorItems =
    loadCalculatorLocal();

  archiveItems =
    loadArchiveLocal();


  renderCalculatorLog();
  updateTotals();
  renderArchive();


  initializeProducts();


  /* =========================================================
     SUPABASE AUTH STATE
  ========================================================= */

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          "Supabase auth event:",
          event
        );

        if (
          event === "SIGNED_IN" &&
          session?.user
        ) {
          const cloudProducts =
            await loadProductsFromSupabase();

          if (
            Array.isArray(
              cloudProducts
            ) &&
            cloudProducts.length > 0
          ) {
            products =
              mergeProducts(
                products,
                cloudProducts
              );

            saveProductsLocal();

            renderProducts(
              searchInput?.value || ""
            );
          }

          await syncProductsToSupabase();
        }
      }
    );
  }

});