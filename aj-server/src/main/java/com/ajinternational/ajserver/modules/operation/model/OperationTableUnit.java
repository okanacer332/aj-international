package com.ajinternational.ajserver.modules.operation.model;

public enum OperationTableUnit {
    PRE_SELECTION("Ön Seçim Masası"),
    SORTING("Ayrıştırma Masası"),
    PRESS("Press Masası");

    private final String label;

    OperationTableUnit(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}