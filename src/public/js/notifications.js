function toggleNotificationRead(notificationId, currentReadStatus) {
    const newReadStatus = !currentReadStatus;

    fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: newReadStatus }),
        credentials: 'include'
    })
        .then(response => {
            if (response.ok) {
                // mivel nincsen reactive JS framework így ezt az adatmódosítgatást nem fogom megcsinálni mert bonyolult és hosszú idő
                // helyette csak egy egyszerű újratöltés van. Van reaktív JS framework csak az Express nem az xdd

                /*const notificationElement = document.getElementById(`notification-id-${notificationId}`);
                if (newReadStatus) {
                    notificationElement.classList.remove("unread");
                    notificationElement.classList.add("read");
                } else {
                    notificationElement.classList.remove("read");
                    notificationElement.classList.add("unread");
                }

                const readBtn = notificationElement.querySelector('.notification-read-btn');
                readBtn.innerHTML = newReadStatus ? "Olvasatlannak jelölés" : "Olvasottnak jelölés";*/
                location.reload();
            } else {
                console.error("Hiba történt az értesítés frissítése során!");
            }
        })
        .catch(error => console.error("Hiba:", error));
}

function deleteNotification(notificationId) {
    fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
        .then(response => {
            if(response.ok) {
                console.log("Értesítés törölve!");
                const notificationElement = document.getElementById(`notification-id-${notificationId}`)
                location.reload();
            } else {
                console.error("Hiba történt az értesítés törlése során!");
            }
        })
        .catch(error => console.error("Hiba:", error));
}

async function handleNotificationInteraction(notificationId, userId, interactionType, interactionStatus, relationId) {
    if(interactionType === 'view') {
        await loadContent(`api/posts/view/${relationId}`);
    } else {
        fetch(`/api/notifications/${notificationId}/interaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                notificationId: notificationId,
                interactionType: interactionType,
                interactionStatus: interactionStatus,
                relationId: relationId
            }),
            credentials: 'include'
        })
            .then(response => {
                if(response.ok) {
                    if(interactionType === "friend-request") {
                        location.reload();
                    }
                }
            })
            .catch(error => console.error("Hiba:", error));
    }
}