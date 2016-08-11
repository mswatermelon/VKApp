/**
 * Created by Вероника on 11.08.2016.
 */
'use strict';

Handlebars.registerHelper( 'concat', function(f,l) {
    return f + " " + l;
});

new Promise(function (resolve) {
    if(document.readyState == "complete"){
        resolve();
    }
    else {
        window.onload = resolve;
    }
}).then(function () {
    return new Promise(function (resolve, reject) {
        VK.init({
           apiId: 5583715
        });
        VK.Auth.login(function (response) {
            if (response.session){
                resolve(response);
            }
            else{
                reject(new Error("Не удалось авторизоваться"));
            }
        }, 2);
    });
}).then(function () {
    return new Promise(function (resolve, reject) {
        VK.api('users.get', {'name_case': 'gen', 'v': '5.53'}, function (response) {
            if (response.error){
                reject(new Error(response.error.error_msg));
            }
            else{
                let headerInfo = document.getElementById('headerInfo'),
                    user = response.response[0];

                headerInfo.textContent = `Друзья ${user.first_name} ${user.last_name}`;
                resolve();
            }
        })
    });
}).then(function () {
    return new Promise(function (resolve, reject) {
        VK.api('friends.get', {'fields':'photo_50,bdate', 'v': '5.53'}, function (response) {
            if (response.error){
                reject(new Error(response.error.error_msg));
            }
            else{
                let mainTemplate = document.getElementById('main-template'),
                    results = document.getElementById('results'),
                    friends = response.response.items,
                    source = mainTemplate.innerHTML,
                    templateFn = Handlebars.compile(source),
                    friendsWDate = [],
                    friendsWYDate = [],
                    friendsODate = [];

                for (let i = 0; i < friends.length; i++){
                    if (friends[i].bdate && friends[i].bdate.split('.').length == 3) {
                        friends[i].date = friends[i].bdate.split('.').reverse();
                        friends[i].age = Math.abs(new Date(new Date() - new Date(friends[i].date)).getUTCFullYear() - 1970);
                        friendsWDate.push(friends[i]);
                    }
                    else if (friends[i].bdate && friends[i].bdate.split('.').length == 2) {
                        friendsWYDate.push(friends[i]);
                    }
                    else{
                        friendsODate.push(friends[i]);
                    }
                }

                friendsWDate.sort(function (a,b) {
                    return new Date(b.date) - new Date(a.date);
                });

                friendsWDate = friendsWDate.concat(friendsWYDate);
                friendsWDate = friendsWDate.concat(friendsODate);

                results.innerHTML = templateFn({ list: friendsWDate });

                resolve();
            }
        })
    });

}).catch(function (e) {
    alert(`Возникла ошибка: ${e.message}`)
});