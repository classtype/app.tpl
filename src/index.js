var fs = require('fs');

var j;
var list;
var use;

var toS = function(str) {
    //return str;
    return '";\n' + str + '\nstr += "';
};

var patterns = [
// use
    /{use\s'([^']*)'}\n/g, function(str, path) {
    // Переводим строку в массив
        path = path.split('/');
        
    // Получаем имя файла
        var file = String(path.pop());
        
    // Получаем тип файла
        var type = String(file.split('.').pop());
        
    // Use не соответствует формату
        if (!type || file == type) {
            return str;
        }
        
    // Добавляем в use новый тип файла
        if (!(type in use)) {
            use[type] = [];
        }
        
    // Добавляем в use новый файл
        use[type].push([path.join('/'), file]);
        
    // Возвращаем пустую строку, тем самым удаляем {use} из кода
        return '';
    },
    
// use:type
    /{use:([^']+)\s'([^']*)'}\n/g, function(str, type, tag) {
    // Тип файла не найден
        if (!(type in use)) {
            return str;
        }
        
    // Создаем список подключаемых файлов
        var tags = [];
        
    // Проходим по списку подключаемых файлов
        for (var i = 0; i < use[type].length; i++) {
            tags[i] = tag
            // Подставляем путь к файлу
                .replace(/{path}/, use[type][i][0] + '' + (use[type][i][0] == '' ? '' : '/'))
                
            // Подставляем имя файла
                .replace(/{file}/, use[type][i][1])
                
            // Подставляем полный путь к файлу (путь + имя)
                .replace(/{src}/, use[type][i][0] + '' + (use[type][i][0] == '' ? '' : '/') + '' + use[type][i][1]) + '\n';
        }
        
    // Переводим массив в строку
        return tags.join('');
    },
    
// for
    /{for\s([a-zA-Z_$]{1}[a-zA-Z_$0-9]*)}/g, function(str, obj) {
        list[obj] = (obj in list ? list[obj] : j++);
        return toS('for (i[' + list[obj] + '] = 0; i[' + list[obj] + '] < vars.' + obj + '.length; i[' + list[obj] + ']++) {');
    },
    
// end for
    /{\/for}/g, toS('}'),
    
// if
    /{if\s([a-zA-Z_$]{1}[^}]*)}/g, toS('if (vars.$1) {'),
    
// else
    /{else}/g, toS('} else {'),
    
// end if
    /{\/if}/g, toS('}'),
    
// var
    /{([a-zA-Z_$]{1}[a-zA-Z_$0-9]*)}/g, '" + vars.$1 + "'
];


fs.readFile('1.html', function(err, str) {
    
    j = 0;
    list = {};
    use = {};
    
    //var text = JSON.stringify(str.toString());
    var text = str.toString();
    for (var i = 0; i < patterns.length; i+=2) {
        text = text.replace(patterns[i], patterns[i + 1]);
    }
    
// for
    for (var obj in list) {
        text = text.replace(
            new RegExp("{" + obj + "\.([a-zA-Z_$]{1}[a-zA-Z_$0-9]*)}","g"),
            '" + vars.' + obj + '[i[' + list[obj] + ']].$1 + "'
        );
    }
    
    var func = '';
    func += 'function(vars) {\n';
    func += 'var i=[];\n';
    func += 'var str = ' + text + ';\n';
    func += 'return str;\n';
    func += '};\n';
    
    console.log(func);
});