use gasflow_backend::domain::orders::OrderStatus;

#[test]
fn valid_status_transitions() {
    assert!(OrderStatus::Pendiente.can_transition_to(&OrderStatus::Asignado));
    assert!(OrderStatus::Asignado.can_transition_to(&OrderStatus::EnReparto));
    assert!(OrderStatus::Asignado.can_transition_to(&OrderStatus::Entregado));
    assert!(OrderStatus::EnReparto.can_transition_to(&OrderStatus::Asignado));
    assert!(OrderStatus::EnReparto.can_transition_to(&OrderStatus::Entregado));
}

#[test]
fn invalid_status_transitions() {
    assert!(!OrderStatus::Pendiente.can_transition_to(&OrderStatus::Entregado));
    assert!(!OrderStatus::Entregado.can_transition_to(&OrderStatus::Asignado));
}
