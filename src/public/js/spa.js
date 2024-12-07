async function loadContent(page) { //TODO ez szar
    try {
        let content;
        if(page !== null) {
            const response = await fetch(`/${page}`);
            content = await response.text();
        } else {
            const response = await fetch(`/api/posts`);
            content = await response.text();
        }
        localStorage.setItem("last-page", page);
        navigationStack.push(page);
        document.getElementById('main-content').innerHTML = content;
    } catch (error) {
        console.error("Hiba történt a tartalom betöltése során:", error);
    }
}
