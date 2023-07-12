package main

import (
	"fmt"

	"github.com/fatih/color"
)

const (
	info = "[INFO]"
	warn = "[WARN]"
	err  = "[ERROR]"
)

type Logger interface {
	Info(format string, args ...interface{})
	Warn(format string, args ...interface{})
	Error(format string, args ...interface{})
}

type StdoutLogger struct{}

func NewStdoutLogger() *StdoutLogger {
	return &StdoutLogger{}
}

func (l *StdoutLogger) Info(format string, args ...interface{}) {
	fmt.Printf(color.GreenString(info)+" "+format, args...)
}

func (l *StdoutLogger) Warn(format string, args ...interface{}) {
	fmt.Printf(color.YellowString(warn)+" "+format, args...)
}

func (l *StdoutLogger) Error(format string, args ...interface{}) {
	fmt.Printf(color.RedString(err)+" "+format, args...)
}
