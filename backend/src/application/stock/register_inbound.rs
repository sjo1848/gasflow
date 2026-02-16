use crate::domain::error::DomainError;
use crate::domain::stock::Inbound;
use crate::ports::stock_port::StockPort;

pub async fn execute<P: StockPort>(port: &P, input: Inbound) -> Result<(), DomainError> {
    if input.cantidad_llenas <= 0 {
        return Err(DomainError::Validation(
            "cantidad_llenas debe ser mayor que 0".to_string(),
        ));
    }

    port.register_inbound(input).await
}
