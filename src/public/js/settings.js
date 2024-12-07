function updateProfile() {
    const username = document.getElementById('username').value;
    const introduction = document.getElementById('introduction').value;
    const date_of_birth = document.getElementById('dateofbirth').value;
    const current_password = document.getElementById('currentpass').value;
    const new_pass = document.getElementById('newpass').value;
    const new_pass_confirm = document.getElementById('newpassconfirm').value;
    const profilevisibility = document.getElementById('profilevisibility').checked;


    const nameTakenLabel = document.getElementById('nametaken');
    const wrongCurrentPassLabel = document.getElementById('wrongcurrentpass');
    const passwordsNotMatchLabel = document.getElementById('passnotmatch');

    if(new_pass && new_pass !== new_pass_confirm){
        passwordsNotMatchLabel.style.display = 'block';
        return;
    }

    fetch(`/api/settings/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                username: username,
                introduction: introduction,
                date_of_birth: date_of_birth,
                current_password: current_password,
                new_password: new_pass,
                profile_visibility: profilevisibility
            }),
        credentials: 'include'
    }).then(response => {
        if(response.status === 400) {
            return response.json().then(data => {
                if(data.code === 1) {
                    nameTakenLabel.style.display = 'block';
                } else if(data.code === 2) {
                    wrongCurrentPassLabel.style.display = 'block';
                }
            })
        }
        if(response.status === 200){
            return response.json().then(data => {
                location.reload()
            })
        }
    }).catch(error => {
        console.log(error)
        alert("Hiba történt: " + error.message)
    })

    uploadPfp()

}

function uploadPfp(){
    const profilePicInput = document.getElementById('profilePicInput');
    if (profilePicInput.files.length > 0) {
        const file = profilePicInput.files[0];
        const formData = new FormData();
        formData.append('profile_picture', file);

        fetch(`/api/upload/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        }).then(response => {
            if(response.status === 200){
                location.reload();
            }
        }).catch(error => {
            console.log(error);
            alert("Error uploading profile picture: " + error.message);
        });
    }
}

