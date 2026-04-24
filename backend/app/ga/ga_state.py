# backend/app/ga/ga_state.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4
import time


# Simpan sementara di RAM (cukup untuk demo skripsi)
GA_SESSIONS: Dict[str, "GASessionState"] = {}


@dataclass
class GASessionState:
    # metadata file
    filename: str
    mime: str
    size: int

    # hasil ekstraksi & biner
    plaintext: str
    bitstring: str

    # GA params
    pop_size: int = 20
    crossover_rate: float = 0.8
    mutation_rate: float = 0.02
    tournament_k: int = 3
    max_generations: int = 5

    # proses generasi
    gen: int = 0
    population: List[bytes] = field(default_factory=list)   # kandidat key 16 byte
    fitness: List[float] = field(default_factory=list)

    parents: Optional[Tuple[bytes, bytes]] = None
    offspring: Optional[Tuple[bytes, bytes]] = None
    mutated: Optional[Tuple[bytes, bytes]] = None

    best_key: Optional[bytes] = None
    best_fitness: Optional[float] = None
    best_key_hex: Optional[str] = None
    ga_meta: Optional[Dict[str, Any]] = None

    # hasil AES
    last_cipher_b64: Optional[str] = None
    last_enc_ms: Optional[float] = None
    last_dec_ms: Optional[float] = None

    # log untuk ditampilkan step-by-step
    history: List[Dict[str, Any]] = field(default_factory=list)

    created_at: float = field(default_factory=time.time)


def new_session(filename: str, mime: str, size: int, plaintext: str, bitstring: str) -> str:
    sid = str(uuid4())
    GA_SESSIONS[sid] = GASessionState(
        filename=filename,
        mime=mime,
        size=size,
        plaintext=plaintext,
        bitstring=bitstring,
    )
    return sid


def get_session(sid: str) -> GASessionState:
    if not sid or sid not in GA_SESSIONS:
        raise KeyError("session_id tidak valid atau sesi sudah hilang.")
    return GA_SESSIONS[sid]


def reset_session(sid: str) -> None:
    st = get_session(sid)
    # reset bagian GA saja, file tetap
    st.gen = 0
    st.population = []
    st.fitness = []
    st.parents = None
    st.offspring = None
    st.mutated = None
    st.best_key = None
    st.best_fitness = None
    st.history = []
    st.best_key_hex = None
    st.ga_meta = None

def delete_session(sid: str) -> None:
    if sid in GA_SESSIONS:
        del GA_SESSIONS[sid]
