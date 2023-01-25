//享元模式 示意

/*享元模式优化代码*/
var Book = function (title, author, genre, pageCount, publisherID, ISBN) {
    this.title = title;
    this.author = author;
    this.genre = genre;
    this.pageCount = pageCount;
    this.publisherID = publisherID;
    this.ISBN = ISBN;
};

/* Book工厂 单例 */
var BookFactory = (function () {
    var existingBooks = {};
    return {
        createBook: function (title, author, genre, pageCount, publisherID, ISBN) {
            /*查找之前是否创建*/
            var existingBook = existingBooks[ISBN];
            if (existingBook) {
                return existingBook;
            } else {
                /* 如果没有，就创建一个，然后保存*/
                var book = new Book(title, author, genre, pageCount, publisherID, ISBN);
                existingBooks[ISBN] = book;
                return book;
            }
        }
    }
});