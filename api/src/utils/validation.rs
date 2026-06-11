pub fn is_controlled_value(value: &str, allowed_values: &[&str]) -> bool {
    allowed_values.contains(&value)
}
