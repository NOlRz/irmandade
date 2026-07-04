    const firebaseUrl = "https://projeto-44d28.firebaseio.com/emmanuel_views.json";

    async function updateViewCounter() {
      try {
        let response = await fetch(firebaseUrl);
        if (!response.ok) throw new Error("Failed to fetch view count");
        let currentCount = await response.json() || 0;

        currentCount += 1;

        await fetch(firebaseUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentCount),
        });

        document.getElementById("view-count").textContent = currentCount;
      } catch (error) {
        console.error("Error updating view counter:", error);
        document.getElementById("view-count").textContent = "Error!";
      }
    }


    updateViewCounter();
