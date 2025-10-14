"""Client for interacting with the Qonto API."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, List, Optional


class ExpenseStatus(str, Enum):
    """Enumeration of expense justification status."""

    JUSTIFIED = "justified"
    MISSING = "missing"


@dataclass(frozen=True)
class Expense:
    """Representation of an expense retrieved from Qonto."""

    id: str
    amount: float
    currency: str
    description: str
    merchant: str
    status: ExpenseStatus
    receipt_url: Optional[str] = None

    @property
    def needs_justification(self) -> bool:
        """Return ``True`` if the expense still lacks justification."""

        return self.status == ExpenseStatus.MISSING


class QontoClient:
    """High-level client used to retrieve expenses from Qonto."""

    def __init__(self, api_key: str, organization: str) -> None:
        self._api_key = api_key
        self._organization = organization

    def fetch_expenses(self) -> List[Expense]:
        """Fetch expenses from Qonto.

        In a production implementation this method would issue authenticated
        HTTP requests to the Qonto API. The current implementation returns a
        static list so the rest of the system can be exercised in tests.
        """

        return [
            Expense(
                id="1",
                amount=19.99,
                currency="EUR",
                description="Office supplies",
                merchant="Amazon",
                status=ExpenseStatus.MISSING,
            ),
            Expense(
                id="2",
                amount=42.0,
                currency="EUR",
                description="Team lunch",
                merchant="Local Bistro",
                status=ExpenseStatus.JUSTIFIED,
                receipt_url="https://files.example.com/receipts/2.pdf",
            ),
        ]

    def filter_missing_expenses(self, expenses: Iterable[Expense]) -> List[Expense]:
        """Return only the expenses that require justification."""

        return [expense for expense in expenses if expense.needs_justification]
