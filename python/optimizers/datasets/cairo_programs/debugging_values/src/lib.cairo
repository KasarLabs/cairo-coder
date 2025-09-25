#[derive(Drop, Debug, Copy)]
struct Point {
    x: u32,
    y: u32,
}

fn main() {
    let point = Point { x: 1, y: 2 };
    println!("Point: {:?}", point);
}
