window.onclick = function(event) {
    var modal = document.getElementById("modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}
let post_id;
let state = true;
async function sendReport() {
    // TODO
	const description = document.getElementById('description').value;
	const report = {
		userId: 1, 
		description: description,
		attachedTo: "post", 
		attachmentId: post_id
	};
	try {
        const response = await fetch(`/api/reports/add`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(report)
		});

		const result = await response.json();

        if (response.ok) {
			closeReportModal();
            document.getElementById("modal").value = ''; // Töröljük a beviteli mezőt
			alert(result.message || 'Bejelentés sikeresen továbbitva.');
		} else {
			alert(result.message || 'Hiba történt a bejelentés létrehozása során.');
		}
    } catch (error) {
        console.error('Hiba a hozzászólás létrehozása során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.');
    }

    closeReportModal();
}

async function handleReportFunc(reportId, state, moderatorReply) {
    if (moderatorReply === '') {
        alert("A válasz nem lehet üres!");
        return;
    }

	const report = {
		reportId, 
        state, 
        moderatorReply
	};
    try {
        const response = await fetch(`/api/reports/handle`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(report),
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
			alert(result.message || 'Sikeres bejelentés töretés. in postfunc.js');
            closeReportModal();
		} else {
			alert(result.message || 'Hiba történt a bejelentés töretése során. in postfunc.js');
		}

    } catch (error) {
        console.error('Hiba a bejelentés töretése során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.' + error);
    }
}

function showReportModal(id) {
    scrollToTop();
    var modal = document.getElementById("modal");
    modal.style.display = "block";
    // TODO: globális változók beállítása, pl. kiválasztott tartalom amit reportolni fog
	post_id = id
}

function closeReportModal() {
    var modal = document.getElementById("modal");
    modal.style.display = "none";
}


// textarea növelése dinamikusan hogy kényelmesebb legyen hosszabb szövegek írására
document.addEventListener("DOMContentLoaded", function() {
    const textarea = document.querySelector(".new-comment-textbox");
    // késleltetés hogy ha pl. nagy szöveg van és frissít a felhasználó az oldalon akkor szintén beállítsa dinamikusan a textareat
    setTimeout(function() {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, 0);
    textarea.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = `${this.scrollHeight}px`;
    });
});

async function addComment(postId) {
    const commentTextbox = document.querySelector(`#comments-container-${postId} .new-comment-textbox`);
    const content = commentTextbox.value.trim();

    if (!content) {
        alert("A hozzászólás nem lehet üres!");
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        const result = await response.json();

        if (response.ok) {
            commentTextbox.value = ''; // Töröljük a beviteli mezőt

            // Új komment megjelenítése a DOM-on
            displayNewComment(postId, result.comment);
        } else {
            alert(result.message || 'Hiba történt a hozzászólás létrehozása során.');
        }
    } catch (error) {
        console.error('Hiba a hozzászólás létrehozása során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.');
    }
}




// Új komment megjelenítése a DOM-on belül
function displayNewComment(postId, comment) {
    const commentsContainer = document.getElementById(`comments-container-${postId}`);
    if (!commentsContainer) {
        console.warn(`Nincs comments-container az adott postId-hoz: ${postId}`);
        return;
    }

    // Új komment HTML elemek létrehozása
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.setAttribute('id', `comment-${comment.id}`); // Komment azonosító hozzárendelése

    commentElement.innerHTML = `
        <div class="header">
            <div class="header-left">
                <img src="${comment.profilePicture || '../images/pfp-placeholder.png'}" alt="profilkép">
                <div class="username-date">
                    <p>${comment.username || 'Te'}</p>
                    <p class="date">${new Date(comment.created_at).toLocaleString()}</p>
                </div>
            </div>
            <div class="header-right">
                <button onclick="showReportModal(${postId}, ${comment.id})" class="report">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </button>
                <button onclick="deleteComment(${postId}, ${comment.id})" class="delete">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
                <button onclick="editComment(${postId}, ${comment.id})" class="edit">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>
        </div>
        <div class="body" id="comment-body-${comment.id}">
            <p id="comment-content-${comment.id}">${comment.content}</p>
        </div>
        <div class="edit-container" id="edit-container-${comment.id}" style="display: none;">
            <textarea id="edit-textarea-${comment.id}">${comment.content}</textarea>
            <button onclick="saveEditedComment(${postId}, ${comment.id})">Mentés</button>
            <button onclick="cancelEditComment(${comment.id})">Mégse</button>
        </div>
    `;

    // Új komment hozzáadása a comments-container végéhez
    commentsContainer.appendChild(commentElement);
}



function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}
async function loadCommentTemplate(postId) {
    const commentsContainer = document.getElementById(`comments-container-${postId}`);

    if (!commentsContainer) {
        console.error(`Nincs comments-container az adott postId-hoz: ${postId}`);
        return;
    }

    // Ha már betöltöttük, csak kapcsoljuk a láthatóságot
    if (commentsContainer.classList.contains('loaded')) {
        commentsContainer.classList.toggle('visible');
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments`); // A szerverről kérjük le a comment-template.ejs renderelt HTML-t
        if (!response.ok) {
            throw new Error('Hiba történt a kommentek betöltésekor.');
        }

        const html = await response.text(); // A szerver HTML-t ad vissza
        commentsContainer.innerHTML = html; // A kapott HTML-t beállítjuk a containerben
        commentsContainer.classList.add('loaded', 'visible');
    } catch (error) {
        console.error('Hiba a kommentek betöltése során:', error);
        commentsContainer.innerHTML = '<p>Hiba történt a kommentek betöltése során.</p>';
    }
}
async function deletePost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Hiba történt: ${errorData.message}`);
            return;
        }

        const result = await response.json();
        //alert(result.message || 'Bejegyzés sikeresen törölve!');
        location.reload();
    } catch (error) {
        console.error('Hiba a bejegyzés törlése során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.');
    }
}
function editPost(postId) {
    const editContainer = document.getElementById(`edit-container-${postId}`);
    const postContent = document.getElementById(`post-content-${postId}`);

    if (!editContainer || !postContent) {
        console.error(`Nem található az edit-container vagy post-content azonosító: ${postId}`);
        return;
    }

    editContainer.style.display = "block";
    postContent.style.display = "none";
}

function cancelEdit(postId) {
    const editContainer = document.getElementById(`edit-container-${postId}`);
    const postContent = document.getElementById(`post-content-${postId}`);

    if (!editContainer || !postContent) {
        console.error(`Nem található az edit-container vagy post-content azonosító: ${postId}`);
        return;
    }

    editContainer.style.display = "none";
    postContent.style.display = "block";
}

async function saveEditedPost(postId) {
    const editContent = document.getElementById(`edit-content-${postId}`);
    const postContent = document.getElementById(`post-content-${postId}`);
    const editContainer = document.getElementById(`edit-container-${postId}`);

    if (!editContent || !postContent || !editContainer) {
        console.error(`Nem található az edit-content vagy post-content azonosító: ${postId}`);
        return;
    }

    const content = editContent.value.trim();
    if (!content) {
        alert("A tartalom nem lehet üres!");
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });

        const result = await response.json();

        if (response.ok) {
            //alert(result.message);
            postContent.innerText = content; // Frissítjük a DOM tartalmát
            editContainer.style.display = "none";
            postContent.style.display = "block";
        } else {
            alert(result.message || "Hiba történt a bejegyzés frissítése során!");
        }
    } catch (error) {
        console.error("Hiba történt a bejegyzés frissítése során:", error);
        alert("Nem sikerült kapcsolódni a szerverhez.");
    }
}
async function deleteComment(postId, commentId) {
    if (!confirm("Biztosan törölni szeretnéd ezt a hozzászólást?")) {
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            //alert(result.message || 'Komment sikeresen törölve!');

            // Komment eltávolítása a DOM-ból
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
                commentElement.remove();
            } else {
                console.warn(`Nem található a comment-${commentId} azonosító.`);
            }
        } else {
            alert(result.message || 'Hiba történt a komment törlése során!');
        }
    } catch (error) {
        console.error('Hiba a komment törlése során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.');
    }
}

function editComment(postId, commentId) {
    // Komment szövege és szerkesztési konténer azonosítása
    const commentBody = document.querySelector(`#comment-body-${commentId}`);
    const editContainer = document.querySelector(`#edit-comment-container-${commentId}`);

    // Ellenőrzés, hogy az elemek léteznek-e
    if (!commentBody) {
        console.error(`Nem található a comment-body azonosító: ${commentId}`);
        return;
    }
    if (!editContainer) {
        console.error(`Nem található az edit-container azonosító: ${commentId}`);
        return;
    }

    // Elemek láthatóságának állítása
    commentBody.style.display = 'none';
    editContainer.style.display = 'block';
}

async function saveEditedComment(postId, commentId) {
    const editTextarea = document.getElementById(`edit-textarea-${commentId}`);
    const newContent = editTextarea.value.trim();

    if (!newContent) {
        alert("A komment tartalma nem lehet üres!");
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: newContent }),
        });

        const result = await response.json();

        if (response.ok) {
            //alert(result.message || 'Komment sikeresen frissítve!');

            // Frissítsük a komment tartalmát a DOM-ban
            const commentContent = document.getElementById(`comment-content-${commentId}`);
            const editContainer = document.getElementById(`edit-comment-container-${commentId}`);
            const commentBody = document.getElementById(`comment-body-${commentId}`);

            if (commentContent && editContainer && commentBody) {
                commentContent.textContent = newContent; // Tartalom frissítése
                editContainer.style.display = 'none'; // Szerkesztő mező elrejtése
                commentBody.style.display = 'block'; // Komment tartalom megjelenítése
            } else {
                console.warn(`Nem található a comment-body vagy edit-container azonosító: ${commentId}`);
            }
        } else {
            alert(result.message || 'Hiba történt a komment frissítése során!');
        }
    } catch (error) {
        console.error('Hiba a komment frissítése során:', error);
        alert('Nem sikerült kapcsolódni a szerverhez.');
    }
}

function cancelEditComment(commentId) {
    const commentBody = document.querySelector(`#comment-body-${commentId}`);
    const editContainer = document.querySelector(`#edit-comment-container-${commentId}`);

    if (!commentBody || !editContainer) {
        console.error(`Nem található a szükséges elem a DOM-ban: ${commentId}`);
        return;
    }

    // Visszaállítjuk az eredeti állapotot
    editContainer.style.display = 'none';
    commentBody.style.display = 'block';
}


// Kommentek sablon generálása
function renderCommentTemplate(postId, comments) {
    return `
        <div class="comments-section">
            <div class="new-comment-container">
                <div class="new-comment-input">
                    <textarea class="new-comment-textbox" placeholder="Új hozzászólás.."></textarea>
                    <i onclick="addComment(${postId})" class="fa-solid fa-arrow-right"></i>
                </div>
            </div>
            ${comments.map(comment => `
                <div class="comment">
                    <div class="header">
                        <div class="header-left">
                            <img src="${comment.profilePicture || '../images/pfp-placeholder.png'}" alt="profilkép">
                            <div class="username-date">
                                <p>${comment.username || 'Ismeretlen'}</p>
                                <p class="date">${new Date(comment.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="header-right">
                            <button onclick="showReportModal(${postId})" class="report"><i class="fa-solid fa-circle-exclamation"></i></button>
                            <button class="delete"><i class="fa-solid fa-circle-xmark"></i></button>
                            <button class="edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        </div>
                    </div>
                    <div class="body">
                        <p>${comment.content}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}



