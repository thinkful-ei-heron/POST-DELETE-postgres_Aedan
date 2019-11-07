create table if not exists bookmarks (
    id uuid unique not null primary key,
    title text not null,
    urls text not null,
    rating integer constraint rating_range check (rating > 0 and rating < 6) not null,
    descr text
);