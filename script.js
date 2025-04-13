document.addEventListener("DOMContentLoaded", function () {
  const cryptoList = document.getElementById("cryptos");
  const comparisonContainer = document.getElementById("comparison-container");
  const sortBySelect = document.getElementById("sortBy");
  const clearComparisonBtn = document.getElementById("clearComparison");
  const themeToggle = document.getElementById("themeToggle");

  const apiUrl =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";

  let selectedCryptos =
    JSON.parse(localStorage.getItem("selectedCryptos")) || [];
  let allCryptos = [];
  let chart;

  // Theme setup
  if (localStorage.getItem("darkMode") === "true") {
    themeToggle.checked = true;
    document.body.classList.add("dark");
  }

  themeToggle.addEventListener("change", function () {
    document.body.classList.toggle("dark", this.checked);
    localStorage.setItem("darkMode", this.checked);
  });

  async function fetchCryptoData() {
    const response = await fetch(apiUrl);
    allCryptos = await response.json();
    localStorage.setItem("allCryptos", JSON.stringify(allCryptos));
    sortAndDisplayCryptos();
  }

  function sortAndDisplayCryptos() {
    const sortBy = sortBySelect.value;
    const sorted = [...allCryptos];

    if (sortBy === "market_cap") {
      sorted.sort((a, b) => b.market_cap - a.market_cap);
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price") {
      sorted.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === "change") {
      sorted.sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
      );
    }

    displayCryptos(sorted);
  }

  function displayCryptos(data) {
    cryptoList.innerHTML = "";
    data.forEach((crypto) => {
      const li = document.createElement("li");
      li.textContent = `${
        crypto.name
      } (${crypto.symbol.toUpperCase()}) - $${crypto.current_price.toLocaleString()}`;
      li.addEventListener("click", () => addToComparison(crypto.id));
      cryptoList.appendChild(li);
    });
  }

  function addToComparison(id) {
    if (selectedCryptos.includes(id)) return;
    if (selectedCryptos.length >= 5) {
      alert("You can compare up to 5 cryptocurrencies.");
      return;
    }
    selectedCryptos.push(id);
    localStorage.setItem("selectedCryptos", JSON.stringify(selectedCryptos));
    updateComparison();
  }

  function removeFromComparison(id) {
    selectedCryptos = selectedCryptos.filter((cid) => cid !== id);
    localStorage.setItem("selectedCryptos", JSON.stringify(selectedCryptos));
    updateComparison();
  }

  function updateComparison() {
    comparisonContainer.innerHTML = "";
    selectedCryptos.forEach((id) => {
      const crypto = allCryptos.find((c) => c.id === id);
      if (crypto) {
        const div = document.createElement("div");
        div.classList.add("comparison-item");
        div.innerHTML = `
            <h3>${crypto.name}</h3>
            <p>Price: $${crypto.current_price.toLocaleString()}</p>
            <p>24h Change: ${crypto.price_change_percentage_24h.toFixed(2)}%</p>
            <p>Market Cap: $${crypto.market_cap.toLocaleString()}</p>
          `;
        div.addEventListener("click", () => {
          renderChart(id);
        });
        comparisonContainer.appendChild(div);
      }
    });
  }

  function renderChart(cryptoId) {
    fetch(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=7`
    )
      .then((res) => res.json())
      .then((data) => {
        const prices = data.prices.map((p) => p[1]);
        const labels = data.prices.map((p) => {
          const d = new Date(p[0]);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        const ctx = document.getElementById("priceChart").getContext("2d");
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: `7-Day Price Trend`,
                data: prices,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 2,
                tension: 0.3,
              },
            ],
          },
        });
      });
  }

  clearComparisonBtn.addEventListener("click", () => {
    selectedCryptos = [];
    localStorage.removeItem("selectedCryptos");
    updateComparison();
  });

  sortBySelect.addEventListener("change", sortAndDisplayCryptos);

  // Auto-refresh every 60 seconds
  setInterval(() => {
    fetchCryptoData();
    updateComparison();
  }, 60000);

  fetchCryptoData();
  updateComparison();
});
