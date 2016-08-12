/**
 * Created by Вероника on 11.08.2016.
 */
'use strict';

// "Хелпер" для соединения имени и фамилии
Handlebars.registerHelper( 'concat', function(f,l) {
    return f + " " + l;
});

new Promise(function (resolve) {
    // Если страница загружена перевести промис в состояние resolved
    if(document.readyState == "complete"){
        resolve();
    }
    else {
        window.onload = resolve;
    }
}).then(function () {
    // Затем инициализировать приложение
    return new Promise(function (resolve, reject) {
        VK.init({
           apiId: 5583715
        });
        // Попробовать залогиниться
        VK.Auth.login(function (response) {
            // Если пользователь залогинился перевести промис в состояние resolved
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
        // Получить информацию о пользователе, чьих друзей мы будем выводить
        VK.api('users.get', {'name_case': 'gen', 'v': '5.53'}, function (response) {
            if (response.error){
                reject(new Error(response.error.error_msg));
            }
            else{
                // Добавить заголовок с именем и фамилией человека, чьих друзей мы будем выводить
                let headerInfo = document.getElementById('headerInfo'),
                    user = response.response[0];

                headerInfo.textContent = `Друзья ${user.first_name} ${user.last_name}`;
                resolve();
            }
        })
    });
}).then(function () {
    return new Promise(function (resolve, reject) {
        // Получить список друзей пользователей, включая фото и дату рождения
        VK.api('friends.get', {'fields':'photo_50,bdate', 'v': '5.53'}, function (response) {
            if (response.error){
                reject(new Error(response.error.error_msg));
            }
            else{
                // Если запрос успешен получить шаблон и контейнер
                let mainTemplate = document.getElementById('main-template'),
                    results = document.getElementById('results'),
                    friends = response.response.items,
                    source = mainTemplate.innerHTML,
                    templateFn = Handlebars.compile(source),
                    friendsWDate = [],
                    friendsWYDate = [],
                    friendsODate = [];

                // Проходим циклом по списку друзей
                for (let i = 0; i < friends.length; i++){
                    // Если в дате рождения есть день, месяц, год
                    if (friends[i].bdate && friends[i].bdate.split('.').length == 3) {
                        // Преобразуем bdate в дату, которую воспримет new Date
                        friends[i].date = friends[i].bdate.split('.').reverse();
                        // Посчитаем возраст
                        friends[i].age = Math.abs(new Date(new Date() - new Date(friends[i].date))
                                .getUTCFullYear() - 1970);
                        // Добавим этих друзей в список друзей с датой рождения
                        friendsWDate.push(friends[i]);
                    }
                    else if (friends[i].bdate && friends[i].bdate.split('.').length == 2) {
                        // Если в дате есть число и месяц добавим в список друзей с датой рождения,
                        //  в которой не указан год
                        friendsWYDate.push(friends[i]);
                    }
                    else{
                        // Всех остальных добавим в другой список.
                        friendsODate.push(friends[i]);
                    }
                }

                // Отсортируем массив друзей по датам рождения
                friendsWDate.sort(function (a,b) {
                    return new Date(b.date) - new Date(a.date);
                });

                // Добавим друзей, у которых не указан год рождения в список
                friendsWDate = friendsWDate.concat(friendsWYDate);
                // Добавим друзей, у которых не указана дата рождения
                friendsWDate = friendsWDate.concat(friendsODate);

                // Вставить в соответствие с шаблоном информацию о друзьях
                results.innerHTML = templateFn({ list: friendsWDate });

                resolve();
            }
        })
    });
}).catch(function (e) {
    alert(`Возникла ошибка: ${e.message}`)
});
