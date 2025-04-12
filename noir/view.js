    /* are you seriously going to force me to create a backend? RETARD */
    const blobId = "1330722938583965696";
    const apiUrl = `https://jsonblob.com/api/jsonBlob/${blobId}`;


    async function updateViewCounter() {
      try {

        let response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch view count");
        let data = await response.json();


        let currentCount = data.views || 0;
        currentCount += 1;


        await fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ views: currentCount }),
        });


        document.getElementById("view-count").textContent = currentCount;
      } catch (error) {
        console.error("Error updating view counter:", error);
        document.getElementById("view-count").textContent = "Error!";
      }
    }


    updateViewCounter();
