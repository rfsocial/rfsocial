function sendFriendRequest(profileId) {
    fetch(`/api/friends/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                friendId: profileId
            }),
        credentials: 'include'
    }).then(response => {
        if(response.status === 200) {
            // location.reload();
        }
    }).catch(error => {
        console.log(error);
        alert(`Hiba! ${error}`)
    })
}

function deleteFriend(friendId) {
    fetch(`/api/friends/remove`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            friendId: friendId
        }),
        credentials: 'include'
    }).then(response => {
        if(response.status === 200) {
            // location.reload();
        }
    }).catch(error => {
        console.log(error);
        alert(`Hiba! ${error}`)
    })
}